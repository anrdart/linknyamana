import type { APIRoute } from 'astro'

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

async function checkSingle(url: string): Promise<'online' | 'offline'> {
  const checks: Promise<'online' | 'offline'>[] = []

  checks.push(
    (async () => {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) return 'offline'
      const text = await res.text()
      return analyzeContent(text)
    })()
  )

  checks.push(
    (async () => {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
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
    })()
  )

  const results = await Promise.allSettled(checks)

  let online = 0
  let offline = 0

  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value === 'online') online++
      else offline++
    }
  }

  return online >= offline ? 'online' : 'offline'
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { urls } = body as { urls: string[] }

    if (!urls || !Array.isArray(urls)) {
      return new Response(JSON.stringify({ error: 'urls array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const total = urls.length
    const encoder = new TextEncoder()
    let checked = 0

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        sendEvent({ type: 'progress', checked: 0, total })

        for (let i = 0; i < urls.length; i++) {
          try {
            const status = await checkSingle(urls[i])
            checked++
            sendEvent({ type: 'result', url: urls[i], status, checked, total })
          } catch {
            checked++
            sendEvent({ type: 'result', url: urls[i], status: 'offline', checked, total })
          }
        }

        sendEvent({ type: 'done', checked: total, total })
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
