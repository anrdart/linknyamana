import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { checkDomain } from '@/lib/status-check'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { url } = body as { url: string }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const status = await checkDomain(url)

    try {
      const sql = getDb(env.DATABASE_URL)
      await sql`
        INSERT INTO domain_status (domain_url, status, checked_at)
        VALUES (${url}, ${status}, NOW())
        ON CONFLICT (domain_url)
        DO UPDATE SET status = ${status}, checked_at = NOW()
      `
    } catch {
      // ignore DB errors
    }

    return new Response(JSON.stringify({ url, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Check error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const domainUrl = url.searchParams.get('url')
    if (!domainUrl) {
      return new Response(JSON.stringify({ error: 'url param required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const force = url.searchParams.get('force') === 'true'

    if (!force) {
      try {
        const sql = getDb(env.DATABASE_URL)
        const cached = await sql`
          SELECT status FROM domain_status
          WHERE domain_url = ${domainUrl} AND checked_at > NOW() - INTERVAL '600 seconds'
        `
        if (cached && cached.length > 0) {
          return new Response(JSON.stringify({ url: domainUrl, status: (cached[0] as { status: string }).status }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch {
        // cache miss
      }
    }

    const status = await checkDomain(domainUrl)

    try {
      const sql = getDb(env.DATABASE_URL)
      await sql`
        INSERT INTO domain_status (domain_url, status, checked_at)
        VALUES (${domainUrl}, ${status}, NOW())
        ON CONFLICT (domain_url)
        DO UPDATE SET status = ${status}, checked_at = NOW()
      `
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ url: domainUrl, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Check error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
