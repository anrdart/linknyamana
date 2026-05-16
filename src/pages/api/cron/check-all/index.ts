import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { checkDomain } from '@/lib/status-check'

const CONCURRENCY = 5

export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth: cron secret header OR valid admin session
  const cronSecret = request.headers.get('X-Cron-Secret')
  const sql = getDb(env.DATABASE_URL)

  if (cronSecret) {
    if (cronSecret !== (env as Record<string, string>).CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Invalid cron secret' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } else {
    const token = cookies.get('session')?.value
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const user = await validateSession(sql, token)
    if (!user || (user.role !== 'admin' && user.username !== 'staffwebdev')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const rows = await sql`
      SELECT url FROM custom_domains
      WHERE archived = false OR archived IS NULL
    `

    const domains = rows.map((r: any) => r.url as string)
    let online = 0
    let offline = 0

    const queue = [...domains]

    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift()
        if (!url) break

        const normalizedUrl = url.replace(/^http:/, 'https:').replace(/\/+$/, '')

        try {
          const { status, responseTimeMs } = await checkDomain(normalizedUrl)

          if (status === 'online') online++
          else offline++

          try {
            await sql`
              INSERT INTO domain_status (domain_url, status, checked_at)
              VALUES (${normalizedUrl}, ${status}, NOW())
              ON CONFLICT (domain_url)
              DO UPDATE SET status = ${status}, checked_at = NOW()
            `
          } catch {
            // ignore
          }

          try {
            await sql`
              INSERT INTO uptime_history (domain_url, status, response_time_ms, checked_at)
              VALUES (${normalizedUrl}, ${status}, ${responseTimeMs}, NOW())
            `
          } catch {
            // uptime_history might not exist yet
          }
        } catch {
          offline++
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    return new Response(
      JSON.stringify({ checked: domains.length, online, offline }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Cron check-all error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
