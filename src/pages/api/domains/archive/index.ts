import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'
import { normalizeUrl } from '@/lib/utils'

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

    const data = await sql`
      SELECT domain_url, archived_at
      FROM archived_domains
      ORDER BY archived_at DESC
    `

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching archived domains:', err)
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
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

    if (!isStaff(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { domain_url, archived } = body || {}

    if (!domain_url) {
      return new Response(JSON.stringify({ error: 'domain_url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalized = normalizeUrl(domain_url)

    if (archived === true) {
      await sql`
        INSERT INTO archived_domains (domain_url)
        VALUES (${normalized})
        ON CONFLICT (domain_url) DO NOTHING
      `
      await sql`
        UPDATE custom_domains SET archived = true WHERE url = ${normalized}
      `
    } else {
      await sql`
        DELETE FROM archived_domains WHERE domain_url = ${normalized}
      `
      await sql`
        UPDATE custom_domains SET archived = false WHERE url = ${normalized}
      `
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error updating archive:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
