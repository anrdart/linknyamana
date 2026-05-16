import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user || !isStaff(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    const body = await request.json()
    const { domains } = body as { domains: { name: string; url: string; category_name: string }[] }

    if (!Array.isArray(domains) || domains.length === 0) {
      return new Response(JSON.stringify({ error: 'domains array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const d of domains) {
      if (!d.name || !d.url || !d.category_name) {
        errors.push(`Missing fields: ${JSON.stringify(d)}`)
        skipped++
        continue
      }
      const normalizedUrl = /^https?:\/\//i.test(d.url) ? d.url.trim() : `https://${d.url.trim()}`
      try {
        await sql`
          INSERT INTO custom_domains (name, url, category_name, owner)
          VALUES (${d.name.trim()}, ${normalizedUrl}, ${d.category_name.trim()}, ${user.username})
        `
        imported++
      } catch (e: any) {
        const msg = e?.message ?? ''
        if (msg.includes('duplicate') || msg.includes('unique')) {
          skipped++
        } else {
          errors.push(`${d.url}: ${msg}`)
          skipped++
        }
      }
    }

    await logActivity(sql, { userId: user.id, username: user.username, action: 'domain.bulk_import', details: { imported, skipped } })

    return new Response(JSON.stringify({ imported, skipped, errors: errors.length > 0 ? errors : undefined }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Import error:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
