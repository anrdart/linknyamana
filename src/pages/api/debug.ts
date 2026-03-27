import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const dbUrl = import.meta.env.DATABASE_URL
  const hasDbUrl = !!dbUrl

  let dbOk = false
  let dbError = ''

  if (hasDbUrl) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(dbUrl)
      await sql`SELECT 1`
      dbOk = true
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err)
    }
  }

  return new Response(
    JSON.stringify({
      database_url_set: hasDbUrl,
      database_url_prefix: hasDbUrl ? dbUrl.substring(0, 30) + '...' : 'MISSING',
      database_connected: dbOk,
      database_error: dbError || null,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
