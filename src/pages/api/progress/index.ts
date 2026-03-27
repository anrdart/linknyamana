import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'

export const GET: APIRoute = async () => {
  const sql = getDb(env.DATABASE_URL)

  try {
    const rows = await sql`
      SELECT domain_name, completed_tasks
      FROM domain_progress
      ORDER BY domain_name
    `

    return new Response(JSON.stringify({ data: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch progress' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  const sql = getDb(env.DATABASE_URL)

  try {
    const body = await request.json()
    const { domain_name, completed_tasks } = body

    if (!domain_name || !Array.isArray(completed_tasks)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await sql`
      INSERT INTO domain_progress (domain_name, completed_tasks, updated_at)
      VALUES (${domain_name}, ${JSON.stringify(completed_tasks)}::jsonb, NOW())
      ON CONFLICT (domain_name)
      DO UPDATE SET
        completed_tasks = ${JSON.stringify(completed_tasks)}::jsonb,
        updated_at = NOW()
    `

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error saving progress:', error)
    return new Response(JSON.stringify({ error: 'Failed to save progress' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
