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

async function checkContent(url: string): Promise<'online' | 'offline' | null> {
  const proxies = [
    async () => {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(12000) }
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
    async () => {
      const res = await fetch(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (!res.ok) throw new Error('proxy error')
      return analyzeContent(await res.text())
    },
  ]

  for (const proxy of proxies) {
    try {
      return await proxy()
    } catch {
      continue
    }
  }

  return null
}

async function checkSingle(url: string): Promise<'online' | 'offline'> {
  const normalizedUrl = url.replace(/^http:/, 'https:')

  let serverReachable = false

  try {
    await fetch(normalizedUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
    serverReachable = true
  } catch {
    try {
      await fetch(normalizedUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })
      serverReachable = true
    } catch {
      return 'offline'
    }
  }

  if (!serverReachable) return 'offline'

  const contentResult = await checkContent(normalizedUrl)

  if (contentResult !== null) return contentResult

  return 'online'
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
