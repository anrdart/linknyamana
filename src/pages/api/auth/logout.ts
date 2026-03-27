import type { APIRoute } from 'astro'
import { destroySession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export const POST: APIRoute = async ({ cookies, locals }) => {
  const databaseUrl = locals.runtime?.env?.DATABASE_URL as string | undefined
  const sql = getDb(databaseUrl)

  const token = cookies.get('session')?.value

  try {
    if (token) {
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
