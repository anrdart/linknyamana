import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export const GET: APIRoute = async ({ request, cookies }) => {
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

    const url = new URL(request.url)
    const format = url.searchParams.get('format')

    const rows = await sql`
      SELECT d.name, d.url, d.category_name, d.archived,
             p.completed_tasks,
             m.expiry_date, m.deadline
      FROM custom_domains d
      LEFT JOIN domain_progress p ON p.domain_url = d.url AND p.user_id = ${user.id}
      LEFT JOIN domain_meta m ON m.domain_url = d.url
      WHERE d.archived = false
      ORDER BY d.category_name, d.name
    `

    const data = (rows || []).map((r: any) => {
      const tasks = r.completed_tasks || []
      return {
        name: r.name,
        url: r.url,
        category: r.category_name,
        completed: tasks.length,
        total: 22,
        percent: Math.round((tasks.length / 22) * 100),
        expiry_date: r.expiry_date,
        deadline: r.deadline,
      }
    })

    if (format === 'csv') {
      const header = 'name,url,category,completed,total,percent,expiry_date,deadline'
      const csvRows = data.map((r: any) =>
        [r.name, r.url, r.category, r.completed, r.total, r.percent, r.expiry_date || '', r.deadline || '']
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      return new Response([header, ...csvRows].join('\n'), {
        status: 200,
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="progress-report.csv"' },
      })
    }

    const totalDomains = data.length
    const completed100 = data.filter((d: any) => d.percent === 100).length
    const avgPercent = totalDomains > 0 ? Math.round(data.reduce((s: number, d: any) => s + d.percent, 0) / totalDomains) : 0

    return new Response(JSON.stringify({
      summary: { totalDomains, completed100, avgPercent },
      data,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Report error:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
