import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { checkDomain } from '@/lib/status-check'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { url } = body as { url: string }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const status = await checkDomain(url)

    try {
      const sql = getDb(env.DATABASE_URL)
      await sql`
        INSERT INTO domain_status (domain_url, status, checked_at)
        VALUES (${url}, ${status}, NOW())
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
    const msg = error instanceof Error ? error.message : String(error)
    const body = await request.json().catch(() => ({}))
    const url = (body as { url?: string }).url ?? ''
    return new Response(JSON.stringify({ url, status: 'offline', error: msg }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
