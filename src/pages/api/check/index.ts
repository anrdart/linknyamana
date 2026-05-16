import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { checkDomain } from '@/lib/status-check'

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
    const { url, force = false } = body as { url: string; force?: boolean }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalizedUrl = url.replace(/^http:/, 'https:').replace(/\/+$/, '')

    if (!force) {
      try {
        const cached = await sql`
          SELECT status FROM domain_status
          WHERE domain_url = ${normalizedUrl} AND checked_at > NOW() - INTERVAL '600 seconds'
        `
        if (cached && cached.length > 0) {
          return new Response(JSON.stringify({ url, status: (cached[0] as { status: string }).status }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          })
        }
      } catch {
        // cache miss
      }
    }

    const { status, responseTimeMs } = await checkDomain(normalizedUrl)

    try {
      await sql`
        INSERT INTO domain_status (domain_url, status, checked_at)
        VALUES (${normalizedUrl}, ${status}, NOW())
        ON CONFLICT (domain_url)
        DO UPDATE SET status = ${status}, checked_at = NOW()
      `
    } catch {
      // ignore DB errors
    }

    try {
      await sql`
        INSERT INTO uptime_history (domain_url, status, response_time_ms, checked_at)
        VALUES (${normalizedUrl}, ${status}, ${responseTimeMs}, NOW())
      `
    } catch {
      // uptime_history table might not exist yet
    }

    return new Response(JSON.stringify({ url, status, response_time_ms: responseTimeMs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Check error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
