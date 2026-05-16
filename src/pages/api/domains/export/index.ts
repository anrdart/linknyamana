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

    const rows = await sql`
      SELECT d.name, d.url, d.category_name, d.owner, d.archived,
             m.registration_date, m.expiry_date
      FROM custom_domains d
      LEFT JOIN domain_meta m ON m.domain_url = d.url
      ORDER BY d.category_name, d.name
    `

    const header = 'name,url,category,owner,archived,registration_date,expiry_date'
    const csvRows = (rows || []).map((r: any) =>
      [r.name, r.url, r.category_name, r.owner, r.archived, r.registration_date || '', r.expiry_date || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header, ...csvRows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="linknyamana-domains.csv"',
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
