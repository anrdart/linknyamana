import type { NeonQueryFunction } from '@neondatabase/serverless'
import { sendEmail } from './email'
import { sendTelegramMessage } from './telegram'

const COOLDOWN_MINUTES: Record<string, number> = {
  downtime: 60,
  expiry: 1440,
  escalation: 240,
}

export async function shouldNotify(sql: NeonQueryFunction<false, false>, domainUrl: string, eventType: string): Promise<boolean> {
  const cooldown = COOLDOWN_MINUTES[eventType] || 60
  const rows = await sql`
    SELECT id FROM notification_log
    WHERE domain_url = ${domainUrl} AND event_type = ${eventType}
    AND sent_at > NOW() - (interval '1 minute' * ${cooldown})
    LIMIT 1
  `
  return !rows || rows.length === 0
}

export async function logNotification(sql: NeonQueryFunction<false, false>, domainUrl: string, channel: string, eventType: string) {
  await sql`INSERT INTO notification_log (domain_url, channel, event_type) VALUES (${domainUrl}, ${channel}, ${eventType})`
}

export async function notifyDowntime(sql: NeonQueryFunction<false, false>, domainUrl: string, config: {
  resendApiKey?: string
  notificationEmails: string[]
  telegramBotToken?: string
  telegramChatId?: string
}) {
  if (!(await shouldNotify(sql, domainUrl, 'downtime'))) return { skipped: true }

  const domainName = domainUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  let sent = 0

  // Email
  if (config.resendApiKey && config.notificationEmails.length > 0) {
    for (const email of config.notificationEmails) {
      const result = await sendEmail({
        apiKey: config.resendApiKey,
        from: 'LinkNyaMana <noreply@ekalliptus.com>',
        to: email,
        subject: `[ALERT] ${domainName} is DOWN`,
        html: `<h2>Domain Down Alert</h2><p><strong>${domainName}</strong> is currently offline.</p><p>Detected at: ${new Date().toLocaleString('id-ID')}</p>`,
      })
      if (result.success) sent++
    }
    await logNotification(sql, domainUrl, 'email', 'downtime')
  }

  // Telegram
  if (config.telegramBotToken && config.telegramChatId) {
    const msg = `🔴 <b>Domain Down</b>\n\n<b>${domainName}</b> is offline.\nDetected: ${new Date().toLocaleString('id-ID')}`
    await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, msg)
    await logNotification(sql, domainUrl, 'telegram', 'downtime')
    sent++
  }

  return { sent }
}

// Feature #11: Escalation
// Check if domain has been offline for > 2 hours continuously (8 checks * 15min)
export async function checkEscalation(sql: NeonQueryFunction<false, false>, domainUrl: string, config: {
  resendApiKey?: string
  escalationEmails: string[]
  telegramBotToken?: string
  telegramChatId?: string
}) {
  const history = await sql`
    SELECT status, checked_at FROM uptime_history
    WHERE domain_url = ${domainUrl}
    ORDER BY checked_at DESC LIMIT 8
  `
  // 8 checks * 15min = 2 hours
  if (!history || history.length < 8) return
  const allOffline = history.every((r: any) => r.status === 'offline')
  if (!allOffline) return

  if (!(await shouldNotify(sql, domainUrl, 'escalation'))) return

  const domainName = domainUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')

  if (config.resendApiKey && config.escalationEmails.length > 0) {
    for (const email of config.escalationEmails) {
      await sendEmail({
        apiKey: config.resendApiKey,
        from: 'LinkNyaMana <noreply@ekalliptus.com>',
        to: email,
        subject: `[ESCALATION] ${domainName} down > 2 hours`,
        html: `<h2>Escalation Alert</h2><p><strong>${domainName}</strong> has been offline for more than 2 hours.</p>`,
      })
    }
    await logNotification(sql, domainUrl, 'email', 'escalation')
  }

  if (config.telegramBotToken && config.telegramChatId) {
    const msg = `🚨 <b>ESCALATION</b>\n\n<b>${domainName}</b> has been offline for 2+ hours!`
    await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, msg)
    await logNotification(sql, domainUrl, 'telegram', 'escalation')
  }
}

// Integration note:
// Call notifyDowntime() from cron worker when a domain's status changes from online -> offline.
// Call checkEscalation() from cron worker after each status check for offline domains.
// The cron worker should load notification config (emails, telegram) and pass it to these functions.
