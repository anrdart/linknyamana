import type { NeonQueryFunction } from '@neondatabase/serverless'
import { serverLog } from './logger'

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

  // Mirror to the live console feed
  const msg = params.target
    ? `${params.username} · ${params.action} · ${params.target}`
    : `${params.username} · ${params.action}`
  await serverLog(sql, 'info', 'activity', msg, params.details).catch(() => {})
}
