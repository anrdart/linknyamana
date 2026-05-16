import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'
import { sendTelegramMessage } from '@/lib/telegram'

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

    if (!isStaff(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rows = await sql`SELECT id, bot_token, chat_id, enabled, created_at FROM telegram_config LIMIT 1`
    const config = rows && rows.length > 0 ? rows[0] : null

    // Mask bot_token for security
    let data = null
    if (config) {
      const rawToken = config.bot_token as string
      const masked = rawToken.length > 8
        ? rawToken.slice(0, 4) + '****' + rawToken.slice(-4)
        : '****'
      data = {
        id: config.id,
        bot_token_masked: masked,
        chat_id: config.chat_id,
        enabled: config.enabled,
        created_at: config.created_at,
      }
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching telegram config:', err)
    return new Response(JSON.stringify({ data: null }), {
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
    const { bot_token, chat_id, enabled, test } = body as {
      bot_token?: string
      chat_id?: string
      enabled?: boolean
      test?: boolean
    }

    // Test mode: send test message using stored config
    if (test) {
      const rows = await sql`SELECT bot_token, chat_id, enabled FROM telegram_config LIMIT 1`
      if (!rows || rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Telegram belum dikonfigurasi' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const cfg = rows[0] as { bot_token: string; chat_id: string; enabled: boolean }
      if (!cfg.enabled) {
        return new Response(JSON.stringify({ error: 'Telegram notifikasi dinonaktifkan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const result = await sendTelegramMessage(
        cfg.bot_token,
        cfg.chat_id,
        '✅ <b>LinkNyaMana test notification</b>\n\nTelegram integration is working!'
      )

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Save mode: upsert config
    if (!bot_token || !chat_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Upsert: delete all + insert (single config row)
    await sql`DELETE FROM telegram_config`
    await sql`
      INSERT INTO telegram_config (bot_token, chat_id, enabled)
      VALUES (${bot_token.trim()}, ${chat_id.trim()}, ${enabled !== false})
    `

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error saving telegram config:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const DELETE: APIRoute = async ({ cookies }) => {
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

    await sql`DELETE FROM telegram_config`

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error deleting telegram config:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
