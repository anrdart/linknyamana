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

    const subject = `⚠️ Domain ${domain_name} Akan Expired`
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#2e2e2e;">Domain Akan Expired</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">Nama Domain</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">${domain_name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">URL</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">${domain_url}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">Tanggal Registrasi</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">${registration_date ?? ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">Tanggal Expired</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">${expiry_date ?? ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">Sisa Hari</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd;">${days_remaining ?? ''}</td>
          </tr>
        </table>
        <p style="margin-top: 16px; color:#555;">Segera perpanjang domain Anda!</p>
      </div>
    `

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
