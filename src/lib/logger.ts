import type { NeonQueryFunction } from '@neondatabase/serverless'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  requestId?: string
  userId?: string
  path?: string
  method?: string
  [key: string]: unknown
}

export function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export function generateRequestId(): string {
  return crypto.randomUUID().slice(0, 8)
}

const MAX_LOG_ROWS = 2000

// Persist a log line to system_logs so it can be streamed to the in-app
// live console. Also mirrors to the Cloudflare console. Fire-and-forget:
// logging must never break the request that emitted it.
export async function serverLog(
  sql: NeonQueryFunction<false, false>,
  level: LogLevel,
  source: string,
  message: string,
  meta?: Record<string, unknown>
): Promise<void> {
  // Mirror to platform console (Cloudflare log stream)
  log(level, `[${source}] ${message}`, meta)

  try {
    await sql`
      INSERT INTO system_logs (level, source, message, meta)
      VALUES (${level}, ${source}, ${message}, ${meta ? JSON.stringify(meta) : null}::jsonb)
    `
    // Trim ring buffer: keep only the most recent MAX_LOG_ROWS rows.
    // Runs cheaply because system_logs.id is a monotonic identity column.
    await sql`
      DELETE FROM system_logs
      WHERE id <= (
        SELECT id FROM system_logs ORDER BY id DESC OFFSET ${MAX_LOG_ROWS} LIMIT 1
      )
    `
  } catch {
    // table missing / DB hiccup — already mirrored to console, so swallow
  }
}
