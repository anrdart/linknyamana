import type { APIRoute } from 'astro'
import { verifyLogin, createSession } from '@/lib/auth'

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json()
    const { username, password } = body as { username: string; password: string }

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await verifyLogin(username, password)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = await createSession(user.id)

    cookies.set('session', token, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })

    return new Response(
      JSON.stringify({
        user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Login error:', msg)
    const hint = msg.includes('DATABASE_URL') || msg.includes('undefined')
      ? 'DATABASE_URL belum dikonfigurasi di environment'
      : msg.includes('DNS') || msg.includes('connect')
        ? 'Gagal terhubung ke database Neon'
        : msg
    return new Response(JSON.stringify({ error: `DB Error: ${hint}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
