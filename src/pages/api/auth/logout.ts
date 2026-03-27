import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { destroySession } from '@/lib/auth'

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get('session')?.value

  try {
    if (token) {
      const sql = getDb(env.DATABASE_URL)
      await destroySession(sql, token)
    }
  } catch {
    // ignore DB errors on logout
  }

  cookies.delete('session', { path: '/' })

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
