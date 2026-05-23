import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { checkDomain } from '@/lib/status-check'
import { fetchRdapData } from '@/lib/rdap'

const CONCURRENCY = 5

export const POST: APIRoute = async ({ request, cookies }) => {
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
    let whoisUpdated = 0

    // Check which domains need WHOIS refresh (no expiry_date or last checked > 7 days)
    let whoisNeeded: Set<string> = new Set()
    try {
      const metaRows = await sql`
        SELECT domain_url FROM domain_meta
        WHERE expiry_date IS NULL
           OR updated_at < NOW() - INTERVAL '7 days'
           OR domain_url NOT IN (SELECT domain_url FROM domain_meta)
      `
      whoisNeeded = new Set((metaRows || []).map((r: any) => r.domain_url))
    } catch { /* */ }

    // Also add domains with no meta entry at all
    try {
      const allMeta = await sql`SELECT domain_url FROM domain_meta`
      const metaUrls = new Set((allMeta || []).map((r: any) => r.domain_url))
      for (const url of domains) {
        const normalized = url.replace(/^http:/, 'https:').replace(/\/+$/, '')
        if (!metaUrls.has(normalized)) whoisNeeded.add(normalized)
      }
    } catch { /* */ }

    const queue = [...domains]

    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift()
        if (!url) break

        const normalizedUrl = url.replace(/^http:/, 'https:').replace(/\/+$/, '')

        try {
          const { status, responseTimeMs, cms } = await checkDomain(normalizedUrl)

          if (status === 'online') online++
          else offline++

          try {
            await sql`
              INSERT INTO domain_status (domain_url, status, detected_cms, checked_at)
              VALUES (${normalizedUrl}, ${status}, ${cms}, NOW())
              ON CONFLICT (domain_url)
              DO UPDATE SET status = ${status}, detected_cms = ${cms}, checked_at = NOW()
            `
          } catch {
            try {
              await sql`
                INSERT INTO domain_status (domain_url, status, checked_at)
                VALUES (${normalizedUrl}, ${status}, NOW())
                ON CONFLICT (domain_url)
                DO UPDATE SET status = ${status}, checked_at = NOW()
              `
            } catch { /* */ }
          }

          try {
            await sql`
              INSERT INTO uptime_history (domain_url, status, response_time_ms, checked_at)
              VALUES (${normalizedUrl}, ${status}, ${responseTimeMs}, NOW())
            `
          } catch { /* */ }

          // Auto-WHOIS for domains that need it
          if (whoisNeeded.has(normalizedUrl)) {
            try {
              const rdap = await fetchRdapData(normalizedUrl)
              if (rdap && (rdap.registrationDate || rdap.expiryDate)) {
                await sql`
                  INSERT INTO domain_meta (domain_url, registration_date, expiry_date, updated_at)
                  VALUES (${normalizedUrl}, ${rdap.registrationDate ?? null}, ${rdap.expiryDate ?? null}, NOW())
                  ON CONFLICT (domain_url)
                  DO UPDATE SET
                    registration_date = COALESCE(${rdap.registrationDate ?? null}, domain_meta.registration_date),
                    expiry_date = COALESCE(${rdap.expiryDate ?? null}, domain_meta.expiry_date),
                    updated_at = NOW()
                `
                whoisUpdated++
              }
            } catch { /* RDAP failures are non-critical */ }
          }
        } catch {
          offline++
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    return new Response(
      JSON.stringify({ checked: domains.length, online, offline, whoisUpdated }),
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
