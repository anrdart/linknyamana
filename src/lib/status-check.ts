export const deadPatterns = [
  'paket telah berakhir',
  'paket sudah berakhir',
  'situs dalam perbaikan',
  'sedang melakukan pemeliharaan',
  'error establishing a database connection',
  'this account has been suspended',
  'domain has expired',
  'nama domain ini sedang',
  'there has been a critical error on this website',
  'briefly unavailable for scheduled maintenance',
  'account has been suspended',
  'website under construction',
  'under construction',
]

export function analyzeContent(text: string): 'online' | 'offline' {
  const lower = text.toLowerCase()
  if (deadPatterns.some((p) => lower.includes(p))) return 'offline'
  return 'online'
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function checkDomain(url: string): Promise<'online' | 'offline'> {
  const normalizedUrl = url.replace(/^http:/, 'https:')

  try {
    const res = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': UA },
    })

    if (res.status >= 500) return 'offline'

    const text = await getTextSnippet(res, 3000)
    return analyzeContent(text)
  } catch {
    return 'offline'
  }
}

async function getTextSnippet(
  response: Response,
  maxChars: number
): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  try {
    while (text.length < maxChars) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.cancel()
  }
  return text.slice(0, maxChars)
}
