import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { checkDomain } from '@/lib/status-check'

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
    const { url } = body as { url: string }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalizedUrl = url.replace(/^http:/, 'https:').replace(/\/+$/, '')
    const status = await checkDomain(normalizedUrl)

    try {
      await sql`
        INSERT INTO domain_status (domain_url, status, checked_at)
        VALUES (${normalizedUrl}, ${status}, NOW())
        ON CONFLICT (domain_url)
        DO UPDATE SET status = ${status}, checked_at = NOW()
      `
    } catch {
      // ignore DB errors
    }

    return new Response(
      JSON.stringify({ url, status }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Deep check error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
