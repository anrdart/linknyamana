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

async function checkWithProxy(url: string, proxyIndex: number): Promise<'online' | 'offline'> {
  const proxies = [
    async (u: string) => {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        { signal: AbortSignal.timeout(15000) }
      )
      if (!res.ok) throw new Error('proxy error')
      const json = (await res.json()) as {
        status: { http_code: number }
        contents: string
      }
      if (json.status?.http_code >= 500) return 'offline'
      return analyzeContent(json.contents ?? '')
    },
    async (u: string) => {
      const res = await fetch(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        { signal: AbortSignal.timeout(15000) }
      )
      if (!res.ok) throw new Error('proxy error')
      return analyzeContent(await res.text())
    },
    async (u: string) => {
      const res = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(u)}`,
        { signal: AbortSignal.timeout(15000) }
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

  return 'offline'
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { url, index = 0 } = body as { url: string; index?: number }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const status = await checkWithProxy(url, index ?? 0)

    return new Response(
      JSON.stringify({ url, status }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ url, status: 'offline', error: msg }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
