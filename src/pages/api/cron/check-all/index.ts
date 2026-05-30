import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { checkDomain } from '@/lib/status-check'
import { fetchRdapData } from '@/lib/rdap'
import { notifyDowntime, checkEscalation } from '@/lib/notifications'
import { serverLog } from '@/lib/logger'

const CONCURRENCY = 5
const BATCH_SIZE = 30
// Shorter per-request timeout in cron to stay under Cloudflare Workers wall-time limit
const CRON_CHECK_TIMEOUT_MS = 8000

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
    // Batch: pick the BATCH_SIZE domains that were checked least recently
    // (or never checked). Spreads ~170 domains across multiple 15-min cron runs
    // so each invocation stays well under the Cloudflare Workers wall-time limit.
    const rows = await sql`
      SELECT d.url, s.status AS prev_status, s.checked_at
      FROM custom_domains d
      LEFT JOIN domain_status s ON s.domain_url = d.url
      WHERE d.archived = false OR d.archived IS NULL
      ORDER BY s.checked_at ASC NULLS FIRST
      LIMIT ${BATCH_SIZE}
    `

    const targets = rows.map((r: any) => ({
      url: r.url as string,
      prevStatus: (r.prev_status ?? null) as string | null,
    }))

    // Load notification config once (shared across all domains in this batch)
    let notificationEmails: string[] = []
    try {
      const emailRows = await sql`SELECT email FROM notification_emails ORDER BY created_at`
      notificationEmails = (emailRows || []).map((r: any) => r.email as string)
    } catch { /* */ }

    let telegramBotToken: string | undefined
    let telegramChatId: string | undefined
    try {
      const tgRows = await sql`SELECT bot_token, chat_id, enabled FROM telegram_config WHERE enabled = true LIMIT 1`
      if (tgRows && tgRows.length > 0) {
        telegramBotToken = (tgRows[0] as any).bot_token
        telegramChatId = (tgRows[0] as any).chat_id
      }
    } catch { /* */ }

    const resendApiKey = (env as Record<string, string>).RESEND_API_KEY
    const escalationEmailsRaw = (env as Record<string, string>).ESCALATION_EMAILS
    const escalationEmails = escalationEmailsRaw
      ? escalationEmailsRaw.split(',').map((e) => e.trim()).filter(Boolean)
      : notificationEmails

    // Determine which domains need WHOIS refresh (missing expiry or stale > 7 days)
    let whoisNeeded: Set<string> = new Set()
    try {
      const metaUrls = new Set<string>()
      const allMeta = await sql`SELECT domain_url, expiry_date, updated_at FROM domain_meta`
      const staleOrMissing = new Set<string>()
      for (const r of (allMeta || []) as any[]) {
        metaUrls.add(r.domain_url)
        const stale = !r.expiry_date || (r.updated_at && new Date(r.updated_at).getTime() < Date.now() - 7 * 86400000)
        if (stale) staleOrMissing.add(r.domain_url)
      }
      for (const t of targets) {
        const normalized = t.url.replace(/^http:/, 'https:').replace(/\/+$/, '')
        if (!metaUrls.has(normalized) || staleOrMissing.has(normalized)) whoisNeeded.add(normalized)
      }
    } catch { /* */ }

    let online = 0
    let offline = 0
    let whoisUpdated = 0
    let alertsSent = 0

    const queue = [...targets]

    const worker = async () => {
      while (queue.length > 0) {
        const target = queue.shift()
        if (!target) break

        const normalizedUrl = target.url.replace(/^http:/, 'https:').replace(/\/+$/, '')

        try {
          const { status, responseTimeMs, cms } = await checkDomain(normalizedUrl, CRON_CHECK_TIMEOUT_MS)

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

          // Log status transitions for the live console
          if (target.prevStatus && target.prevStatus !== status) {
            await serverLog(
              sql,
              status === 'offline' ? 'warn' : 'info',
              'cron',
              `${normalizedUrl}: ${target.prevStatus} → ${status} (${responseTimeMs}ms)`,
            )
          }

          // Downtime alert: trigger when status transitions online -> offline
          if (status === 'offline' && target.prevStatus === 'online') {
            try {
              const result = await notifyDowntime(sql, normalizedUrl, {
                resendApiKey,
                notificationEmails,
                telegramBotToken,
                telegramChatId,
              })
              if (result && 'sent' in result && result.sent) {
                alertsSent += result.sent
                await serverLog(sql, 'warn', 'alert', `Downtime alert sent for ${normalizedUrl} (${result.sent} channel)`)
              }
            } catch { /* notification failures are non-critical */ }
          }

          // Escalation: domain offline for 2+ hours continuously
          if (status === 'offline') {
            try {
              await checkEscalation(sql, normalizedUrl, {
                resendApiKey,
                escalationEmails,
                telegramBotToken,
                telegramChatId,
              })
            } catch { /* */ }
          }

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

    await serverLog(
      sql,
      offline > 0 ? 'warn' : 'info',
      'cron',
      `Scan selesai: ${targets.length} domain · ${online} online · ${offline} offline · ${whoisUpdated} WHOIS · ${alertsSent} alert`,
    )

    return new Response(
      JSON.stringify({ checked: targets.length, online, offline, whoisUpdated, alertsSent }),
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
