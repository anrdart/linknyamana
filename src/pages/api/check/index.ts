import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'
import { checkDomain } from '@/lib/status-check'

const BATCH_SIZE = 3
const BATCH_DELAY = 1200

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { urls, force = false } = body as { urls: string[]; force?: boolean }

    if (!urls || !Array.isArray(urls)) {
      return new Response(JSON.stringify({ error: 'urls array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const sql = getDb(env.DATABASE_URL)
    const total = urls.length
    const encoder = new TextEncoder()
    let checked = 0

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        sendEvent({ type: 'progress', checked: 0, total })

        if (!force) {
          try {
            const cached = await sql`
              SELECT domain_url, status
              FROM domain_status
              WHERE domain_url = ANY(${urls}) AND checked_at > NOW() - INTERVAL '600 seconds'
            `
            if (cached && cached.length > 0) {
              const cacheMap = new Map<string, string>()
              for (const row of cached) {
                cacheMap.set((row as { domain_url: string }).domain_url, (row as { status: string }).status)
              }
              for (const url of urls) {
                checked++
                sendEvent({ type: 'result', url, status: (cacheMap.get(url) as 'online' | 'offline') || 'offline', checked, total })
              }
              sendEvent({ type: 'done', checked: total, total, from_cache: true })
              controller.close()
              return
            }
          } catch {
            // cache miss, proceed
          }
        }

        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
          const batch = urls.slice(i, i + BATCH_SIZE)

          const results = await Promise.allSettled(
            batch.map(async (url) => ({
              url,
              status: await checkDomain(url),
            }))
          )

          for (const result of results) {
            checked++
            const url = result.status === 'fulfilled' ? result.value.url : batch[results.indexOf(result)]
            const status: 'online' | 'offline' =
              result.status === 'fulfilled' ? result.value.status : 'offline'

            sendEvent({ type: 'result', url, status, checked, total })

            try {
              await sql`
                INSERT INTO domain_status (domain_url, status, checked_at)
                VALUES (${url}, ${status}, NOW())
                ON CONFLICT (domain_url)
                DO UPDATE SET status = ${status}, checked_at = NOW()
              `
            } catch {
              // ignore
            }
          }

          if (i + BATCH_SIZE < urls.length) {
            await delay(BATCH_DELAY)
          }
        }

        sendEvent({ type: 'done', checked: total, total, from_cache: false })
        controller.close()
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Check status error:', error)
    return new Response(JSON.stringify({ error: 'Failed to check status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
