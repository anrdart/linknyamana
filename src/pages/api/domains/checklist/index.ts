import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'

export const GET: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const url = new URL(request.url)
    const domainUrl = url.searchParams.get('domain_url')
    if (!domainUrl) {
      return new Response(JSON.stringify({ error: 'domain_url required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const rows = await sql`SELECT steps FROM domain_checklist WHERE domain_url = ${domainUrl} LIMIT 1`
    const steps = rows && rows.length > 0 ? (rows[0] as any).steps : null

    return new Response(JSON.stringify({ data: steps }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ data: null }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
}

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
    const { domain_url, steps } = body
    if (!domain_url || !Array.isArray(steps)) {
      return new Response(JSON.stringify({ error: 'domain_url and steps required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    await sql`
      INSERT INTO domain_checklist (domain_url, steps, updated_at)
      VALUES (${domain_url}, ${JSON.stringify(steps)}::jsonb, NOW())
      ON CONFLICT (domain_url) DO UPDATE SET steps = ${JSON.stringify(steps)}::jsonb, updated_at = NOW()
    `

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Checklist save error:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
