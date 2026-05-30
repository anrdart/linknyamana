import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession, isStaff } from '@/lib/auth'

// GET: live console feed (admin only).
//   ?after=<id>   — return only rows newer than this id (incremental tail)
//   ?limit=<n>    — max rows (default 100, cap 500)
//   ?level=<lvl>  — filter by minimum level (debug|info|warn|error)
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
    if (!user || !isStaff(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const afterRaw = url.searchParams.get('after')
    const after = afterRaw && /^\d+$/.test(afterRaw) ? BigInt(afterRaw) : null
    const limitRaw = parseInt(url.searchParams.get('limit') ?? '100', 10)
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 100, 1), 500)
    const level = url.searchParams.get('level')
    const levelFilter = ['debug', 'info', 'warn', 'error'].includes(level ?? '') ? level : null

    let rows
    if (after !== null) {
      rows = await sql`
        SELECT id, level, source, message, meta, created_at
        FROM system_logs
        WHERE id > ${after.toString()}
          AND (${levelFilter}::text IS NULL OR level = ${levelFilter})
        ORDER BY id ASC
        LIMIT ${limit}
      `
    } else {
      // Initial load: newest N rows, returned oldest-first for natural console order
      rows = await sql`
        SELECT id, level, source, message, meta, created_at
        FROM (
          SELECT id, level, source, message, meta, created_at
          FROM system_logs
          WHERE (${levelFilter}::text IS NULL OR level = ${levelFilter})
          ORDER BY id DESC
          LIMIT ${limit}
        ) t
        ORDER BY id ASC
      `
    }

    const data = rows || []
    const lastId = data.length > 0 ? (data[data.length - 1] as any).id : afterRaw ?? '0'

    return new Response(JSON.stringify({ data, lastId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('Error fetching system logs:', err)
    return new Response(JSON.stringify({ data: [], lastId: '0' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// DELETE: clear the console buffer (admin only)
export const DELETE: APIRoute = async ({ cookies }) => {
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
    if (!user || !isStaff(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await sql`TRUNCATE system_logs RESTART IDENTITY`

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error clearing system logs:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
