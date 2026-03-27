import type { APIRoute } from 'astro'
import { getDb } from '@/lib/db'

export const GET: APIRoute = async ({ locals }) => {
  const envDbUrl = locals.runtime?.env?.DATABASE_URL as string | undefined
  const metaDbUrl = import.meta.env.DATABASE_URL as string | undefined

  let dbOk = false
  let dbError = ''

  try {
    const sql = getDb(envDbUrl || metaDbUrl)
    await sql`SELECT 1`
    dbOk = true
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err)
  }

  return new Response(
    JSON.stringify({
      env_database_url: !!envDbUrl,
      meta_database_url: !!metaDbUrl,
      database_connected: dbOk,
      database_error: dbError || null,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
