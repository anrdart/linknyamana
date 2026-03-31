import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const GET: APIRoute = async ({ cookies }) => {
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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rows = await sql`
      SELECT domain_url, registration_date, expiry_date, whatsapp_notify, created_at, updated_at
      FROM domain_meta
      ORDER BY domain_url
    `

    return new Response(JSON.stringify({ data: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { domain_url, registration_date, expiry_date, whatsapp_notify } = body

    if (!domain_url) {
      return new Response(JSON.stringify({ error: 'domain_url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await sql`
      INSERT INTO domain_meta (domain_url, registration_date, expiry_date, whatsapp_notify, created_at, updated_at)
      VALUES (${domain_url}, ${registration_date ?? null}, ${expiry_date ?? null}, ${typeof whatsapp_notify === 'boolean' ? whatsapp_notify : true}, NOW(), NOW())
      ON CONFLICT (domain_url)
      DO UPDATE SET
        registration_date = EXCLUDED.registration_date,
        expiry_date = EXCLUDED.expiry_date,
        whatsapp_notify = EXCLUDED.whatsapp_notify,
        updated_at = NOW()
    `

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error upserting domain_meta:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
