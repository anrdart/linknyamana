import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { normalizeUrl } from '@/lib/utils'

export const GET: APIRoute = async ({ request, cookies }) => {
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

    const url = new URL(request.url)
    const domainUrl = url.searchParams.get('domain_url')
    const days = parseInt(url.searchParams.get('days') || '7', 10)
    const summary = url.searchParams.get('summary') === 'true'

    if (summary) {
      const rows = domainUrl
        ? await sql`
            SELECT
              domain_url,
              COUNT(*)::int AS total_checks,
              COUNT(*) FILTER (WHERE status = 'online')::int AS online_checks,
              ROUND(COUNT(*) FILTER (WHERE status = 'online') * 100.0 / NULLIF(COUNT(*), 0), 2) AS uptime_percent,
              ROUND(AVG(response_time_ms)::numeric, 0)::int AS avg_response_ms
            FROM uptime_history
            WHERE domain_url = ${normalizeUrl(domainUrl)}
              AND checked_at > NOW() - MAKE_INTERVAL(days => ${days})
            GROUP BY domain_url
          `
        : await sql`
            SELECT
              domain_url,
              COUNT(*)::int AS total_checks,
              COUNT(*) FILTER (WHERE status = 'online')::int AS online_checks,
              ROUND(COUNT(*) FILTER (WHERE status = 'online') * 100.0 / NULLIF(COUNT(*), 0), 2) AS uptime_percent,
              ROUND(AVG(response_time_ms)::numeric, 0)::int AS avg_response_ms
            FROM uptime_history
            WHERE checked_at > NOW() - MAKE_INTERVAL(days => ${days})
            GROUP BY domain_url
            ORDER BY domain_url
          `

      return new Response(JSON.stringify({ data: rows }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!domainUrl) {
      return new Response(JSON.stringify({ error: 'domain_url required when summary=false' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rows = await sql`
      SELECT domain_url, status, response_time_ms, checked_at
      FROM uptime_history
      WHERE domain_url = ${normalizeUrl(domainUrl)}
        AND checked_at > NOW() - MAKE_INTERVAL(days => ${days})
      ORDER BY checked_at DESC
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
