import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'

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
    const { current_password, new_password } = body || {}

    if (!current_password || !new_password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (new_password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rows = await sql`
      SELECT password_hash FROM users WHERE id = ${user.id} LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const bcrypt = (await import('bcryptjs')).default
    const valid = await bcrypt.compare(current_password, (rows[0] as { password_hash: string }).password_hash)

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Password lama salah' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const newHash = await bcrypt.hash(new_password, 10)

    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`

    // Invalidate all sessions except current
    await sql`DELETE FROM sessions WHERE user_id = ${user.id} AND token != ${token}`

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error changing password:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
