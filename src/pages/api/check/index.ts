import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/lib/db'

const CACHE_TTL_SECONDS = 600

const deadPatterns = [
  'paket telah berakhir',
  'paket sudah berakhir',
  'situs dalam perbaikan',
  'sedang melakukan pemeliharaan',
  'error establishing a database connection',
  'this account has been suspended',
  'domain has expired',
  'nama domain ini sedang',
]

function analyzeContent(body: string): 'online' | 'offline' {
  const lower = body.toLowerCase()
  if (deadPatterns.some((p) => lower.includes(p))) return 'offline'
  if (lower.length < 100) return 'offline'
  return 'online'
}

async function fetchContent(url: string, proxyIndex: number): Promise<'online' | 'offline' | null> {
  const proxies = [
    async (u: string) => {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (!res.ok) throw new Error('proxy error')
      const json = (await res.json()) as {
        status: { http_code: number }
        contents: string
      }
      const httpCode = json.status?.http_code ?? 0
      if (httpCode < 200 || httpCode >= 500) return 'offline'
      return analyzeContent(json.contents ?? '')
    },
    async (u: string) => {
      const res = await fetch(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (!res.ok) throw new Error('proxy error')
      return analyzeContent(await res.text())
    },
    async (u: string) => {
      const res = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(u)}`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (!res.ok && res.status !== 0) throw new Error('proxy error')
      return analyzeContent(await res.text())
    },
  ]

  const rotated = [...proxies.slice(proxyIndex % proxies.length), ...proxies.slice(0, proxyIndex % proxies.length)]

  for (const proxy of rotated) {
    try {
      return await proxy(url)
    } catch {
      continue
    }
  }

  return null
}

async function checkSingle(url: string, index: number): Promise<'online' | 'offline'> {
  const normalizedUrl = url.replace(/^http:/, 'https:')

  try {
    const res = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (res.status >= 500) return 'offline'

    const contentResult = await fetchContent(normalizedUrl, index)
    if (contentResult !== null) return contentResult

    return 'online'
  } catch {
    return 'offline'
  }
}

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
              WHERE domain_url = ANY(${urls}) AND checked_at > NOW() - INTERVAL '${CACHE_TTL_SECONDS} seconds'
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
            // cache miss, proceed to check
          }
        }

        for (let i = 0; i < urls.length; i++) {
          try {
            const status = await checkSingle(urls[i], i)
            checked++
            sendEvent({ type: 'result', url: urls[i], status, checked, total })

            try {
              await sql`
                INSERT INTO domain_status (domain_url, status, checked_at)
                VALUES (${urls[i]}, ${status}, NOW())
                ON CONFLICT (domain_url)
                DO UPDATE SET status = ${status}, checked_at = NOW()
              `
            } catch {
              // cache write fail, not critical
            }
          } catch {
            checked++
            sendEvent({ type: 'result', url: urls[i], status: 'offline', checked, total })
          }

          if (i < urls.length - 1) {
            await delay(800)
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
