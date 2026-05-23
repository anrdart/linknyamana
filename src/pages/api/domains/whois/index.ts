import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'
import { normalizeUrl } from '@/lib/utils'
import { fetchRdapData } from '@/lib/rdap'

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { domain_url } = body as { domain_url: string }

    if (!domain_url) {
      return new Response(JSON.stringify({ error: 'domain_url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rdap = await fetchRdapData(domain_url)
    if (!rdap) {
      const hostname = new URL(domain_url).hostname
      const tld = hostname.split('.').slice(-1)[0]
      return new Response(JSON.stringify({ error: `WHOIS data tidak tersedia untuk .${tld} — silakan isi manual` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalized = normalizeUrl(domain_url)

    await sql`
      INSERT INTO domain_meta (domain_url, registration_date, expiry_date, created_at, updated_at)
      VALUES (${normalized}, ${rdap.registrationDate ?? null}, ${rdap.expiryDate ?? null}, NOW(), NOW())
      ON CONFLICT (domain_url)
      DO UPDATE SET
        registration_date = COALESCE(EXCLUDED.registration_date, domain_meta.registration_date),
        expiry_date = COALESCE(EXCLUDED.expiry_date, domain_meta.expiry_date),
        updated_at = NOW()
    `

    return new Response(JSON.stringify({ data: rdap }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('WHOIS lookup error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
