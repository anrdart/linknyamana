import type { APIRoute } from 'astro'
import { validateSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export const GET: APIRoute = async ({ cookies, locals }) => {
  const databaseUrl = locals.runtime?.env?.DATABASE_URL as string | undefined
  const sql = getDb(databaseUrl)

  const token = cookies.get('session')?.value

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let user
  try {
    user = await validateSession(sql, token)
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role } }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
