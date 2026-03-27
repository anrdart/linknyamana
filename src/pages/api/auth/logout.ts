import type { APIRoute } from 'astro'
import { destroySession } from '@/lib/auth'

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get('session')?.value

  try {
    if (token) {
      await destroySession(token)
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
