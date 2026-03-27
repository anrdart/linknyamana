import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      has_db_url: !!env.DATABASE_URL,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
