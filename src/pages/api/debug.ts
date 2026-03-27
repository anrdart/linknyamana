import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ locals }) => {
  try {
    const hasLocals = !!locals
    const runtime = (locals as Record<string, unknown>)?.runtime as Record<string, unknown> | undefined
    const hasRuntime = !!runtime
    const env = runtime?.env as Record<string, unknown> | undefined
    const hasEnv = !!env
    const hasDbUrl = !!env?.DATABASE_URL

    return new Response(
      JSON.stringify({
        has_locals: hasLocals,
        has_runtime: hasRuntime,
        has_env: hasEnv,
        has_db_url: hasDbUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
