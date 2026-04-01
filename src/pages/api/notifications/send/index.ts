import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

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
    const { domain_url, domain_name, days_remaining, registration_date, expiry_date } = body || {}

    if (!domain_name || !domain_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const resendApiKey = env.RESEND_API_KEY as string | undefined
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const fromAddress = 'LinkNyaMana <noreply@ekalliptus.com>'

    let recipients: string[] = []
    try {
      const rows = await sql`SELECT email FROM notification_emails ORDER BY created_at`
      recipients = (rows || []).map((r: { email: string }) => r.email)
    } catch {
      const fallback = env.NOTIFICATION_EMAIL as string | undefined
      if (fallback) recipients = [fallback]
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'Tidak ada email notifikasi yang terdaftar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const urgency = (days_remaining ?? 99) <= 7 ? 'urgent' : (days_remaining ?? 99) <= 14 ? 'warning' : 'normal'
    const urgencyColors = {
      urgent: { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', badgeText: '#fff', text: '#991b1b' },
      warning: { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', badgeText: '#fff', text: '#92400e' },
      normal: { bg: '#f0f9ff', border: '#93c5fd', badge: '#2563eb', badgeText: '#fff', text: '#1e3a5f' },
    }
    const c = urgencyColors[urgency]

    const formattedExpiry = expiry_date
      ? new Date(expiry_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '-'
    const formattedRegistration = registration_date
      ? new Date(registration_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '-'

    const subject = urgency === 'urgent'
      ? `[URGENT] Domain ${domain_name} expired dalam ${days_remaining} hari!`
      : `[Reminder] Domain ${domain_name} akan expired dalam ${days_remaining} hari`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%); padding:32px 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.7); font-weight:500; letter-spacing:0.5px;">LINKNYAMANA</p>
                    <h1 style="margin:8px 0 0 0; font-size:22px; color:#ffffff; font-weight:700;">Domain Expiry Alert</h1>
                  </td>
                  <td align="right" valign="top">
                    <table cellpadding="0" cellspacing="0" style="background-color:${c.badge}; border-radius:8px;">
                      <tr>
                        <td style="padding:8px 16px; font-size:20px; font-weight:800; color:${c.badgeText}; text-align:center; line-height:1;">
                          ${days_remaining ?? '?'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 12px 6px 12px; font-size:10px; font-weight:600; color:${c.badgeText}; text-transform:uppercase; letter-spacing:0.5px; text-align:center; opacity:0.9;">
                          hari lagi
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Domain Info -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.bg}; border:1px solid ${c.border}; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px 0; font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Nama Domain</p>
                    <p style="margin:0; font-size:20px; color:${c.text}; font-weight:700;">${domain_name}</p>
                    <p style="margin:6px 0 0 0; font-size:13px; color:#64748b;">
                      <a href="${domain_url}" style="color:#2563eb; text-decoration:none;">${domain_url}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0; background-color:#f8fafc;">
                    <p style="margin:0; font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Tanggal Registrasi</p>
                    <p style="margin:4px 0 0 0; font-size:14px; color:#334155; font-weight:500;">${formattedRegistration}</p>
                  </td>
                  <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0; background-color:#f8fafc; border-left:1px solid #e2e8f0;">
                    <p style="margin:0; font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Tanggal Expired</p>
                    <p style="margin:4px 0 0 0; font-size:14px; color:#334155; font-weight:500;">${formattedExpiry}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:4px 32px 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 20px; background-color:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
                    <p style="margin:0 0 2px 0; font-size:14px; color:#475569; font-weight:600;">
                      ${urgency === 'urgent' ? 'Domain sudah hampir expired!' : urgency === 'warning' ? 'Segera perpanjang domain Anda!' : 'Jangan lupa perpanjang domain Anda.'}
                    </p>
                    <p style="margin:0; font-size:12px; color:#94a3b8;">
                      Hubungi penyedia domain untuk memperpanjang sebelum masa berlaku habis.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px 32px; border-top:1px solid #e2e8f0;">
              <p style="margin:16px 0 0 0; font-size:11px; color:#94a3b8; text-align:center;">
                Email ini dikirim otomatis oleh <strong style="color:#64748b;">LinkNyaMana</strong> &mdash; Domain Monitoring Dashboard
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const recipient of recipients) {
      try {
        const res = await sendEmail({
          apiKey: resendApiKey,
          from: fromAddress,
          to: recipient,
          subject,
          html,
        })
        if (res.success) {
          sent++
        } else {
          failed++
          errors.push(`${recipient}: ${res.error || 'Unknown error'}`)
        }
      } catch {
        failed++
        errors.push(`${recipient}: Send failed`)
      }
    }

    return new Response(JSON.stringify({ success: true, sent, failed, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error sending notification:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
