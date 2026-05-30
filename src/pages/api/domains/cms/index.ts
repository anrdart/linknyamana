import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'
import { normalizeUrl } from '@/lib/utils'

const VALID_CMS = ['wordpress', 'custom', 'auto']

// POST: manually override the detected CMS for a domain (admin/editor only).
// Pass cms='auto' to clear the override and fall back to auto-detection.
export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user || !isStaff(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { domain_url, cms } = body as { domain_url: string; cms: string }

    if (!domain_url || !cms || !VALID_CMS.includes(cms)) {
      return new Response(JSON.stringify({ error: 'domain_url and valid cms (wordpress|custom|auto) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalized = normalizeUrl(domain_url)
    const override = cms === 'auto' ? null : cms

    await sql`
      INSERT INTO domain_status (domain_url, status, cms_override, checked_at)
      VALUES (${normalized}, 'checking', ${override}, NOW())
      ON CONFLICT (domain_url)
      DO UPDATE SET cms_override = ${override}
    `

    return new Response(JSON.stringify({ success: true, cms_override: override }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('CMS override error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
