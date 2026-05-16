import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('session')?.value
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const sql = getDb(env.DATABASE_URL)
    const user = await validateSession(sql, token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const [statusCounts, uptimeTrend, categoryProgress] = await Promise.all([
      sql`
        SELECT status, count(*)::int as count
        FROM domain_status
        GROUP BY status
      `.catch(() => []),
      sql`
        SELECT date_trunc('day', checked_at)::date as day,
               count(*)::int as total,
               count(*) FILTER (WHERE status = 'online')::int as online
        FROM uptime_history
        WHERE checked_at > NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day
      `.catch(() => []),
      sql`
        SELECT d.category_name,
               count(*)::int as total_domains,
               count(p.domain_url) FILTER (WHERE jsonb_array_length(p.completed_tasks) = 22)::int as completed
        FROM custom_domains d
        LEFT JOIN domain_progress p ON p.domain_url = d.url
        WHERE d.archived = false
        GROUP BY d.category_name
        ORDER BY d.category_name
      `.catch(() => []),
    ])

    const statusData = (statusCounts as any[]).map((r: any) => ({ name: r.status, value: r.count }))

    const uptimeData = (uptimeTrend as any[]).map((r: any) => ({
      date: r.day,
      uptime: r.total > 0 ? Math.round((r.online / r.total) * 100) : 0,
    }))

    const progressData = (categoryProgress as any[]).map((r: any) => ({
      category: r.category_name,
      total: r.total_domains,
      completed: r.completed,
    }))

    return new Response(JSON.stringify({ statusData, uptimeData, progressData }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
