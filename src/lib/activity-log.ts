import type { NeonQueryFunction } from '@neondatabase/serverless'

export async function logActivity(
  sql: NeonQueryFunction<false, false>,
  params: {
    userId?: string
    username: string
    action: string
    target?: string
    details?: Record<string, unknown>
  }
) {
  try {
    await sql`INSERT INTO activity_log (user_id, username, action, target, details)
      VALUES (${params.userId ?? null}, ${params.username}, ${params.action}, ${params.target ?? null}, ${params.details ? JSON.stringify(params.details) : null}::jsonb)`
  } catch {
    /* fire and forget */
  }
}
