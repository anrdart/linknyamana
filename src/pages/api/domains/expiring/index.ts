import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const GET: APIRoute = async ({ request, cookies }) => {
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

    const url = new URL(request.url)
    const daysParam = url.searchParams.get('days')
    const daysInt = Number.isFinite(parseInt(daysParam ?? '', 10))
      ? parseInt(daysParam ?? '30', 10)
      : 30
    const limitDays = Math.max(1, daysInt)

    const rows = await sql`
      SELECT domain_url, registration_date, expiry_date,
             (EXTRACT(EPOCH FROM (expiry_date - NOW())) / 86400)::int AS days_remaining
      FROM domain_meta
      WHERE expiry_date <= NOW() + (interval '1 day' * ${limitDays})
        AND expiry_date >= NOW()
      ORDER BY days_remaining ASC
    `

    return new Response(JSON.stringify({ data: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error querying expiring domains:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
