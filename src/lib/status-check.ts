export const deadPatterns = [
  // Indonesian hosting
  'paket telah berakhir',
  'paket sudah berakhir',
  'masa aktif domain',
  'domain tidak ditemukan',
  'domain ini telah expired',
  'domain ini sedang',
  'nama domain ini sedang',
  'layanan telah berakhir',
  'situs dalam perbaikan',
  'sedang melakukan pemeliharaan',
  'akun anda telah dinonaktifkan',
  'hosting telah expired',
  'silakan hubungi penyedia hosting',
  'domain belum terhubung',
  'website tidak dapat diakses',
  // English hosting/registrar
  'error establishing a database connection',
  'this account has been suspended',
  'account has been suspended',
  'domain has expired',
  'this domain has expired',
  'there has been a critical error on this website',
  'briefly unavailable for scheduled maintenance',
  'website under construction',
  'under construction',
  'under maintenance',
  'website under maintenance',
  'dns points to prohibited ip',
  'dns_probe_finished_nxdomain',
  // Parking/sale pages
  'this domain is for sale',
  'buy this domain',
  'domain is parked',
  'parked free',
  'parked by',
  'is available for purchase',
  'this webpage is parked',
  'sedang dijual',
  'domain dijual',
  'coming soon',
  // Cloudflare errors
  'error 1000',
  'error 1001',
  'error 1003',
  'error 1014',
  'error 1016',
  'error 522',
  'error 524',
]

const PARKING_HOSTS = [
  'sedoparking.com',
  'parkingcrew.net',
  'bodis.com',
  'afternic.com',
  'hugedomains.com',
  'dan.com',
  'sav.com',
  'domainmarket.com',
]

export function analyzeContent(text: string): 'online' | 'offline' {
  if (!text || text.trim().length < 50) return 'offline'
  const lower = text.toLowerCase()
  if (deadPatterns.some((p) => lower.includes(p))) return 'offline'
  return 'online'
}

function isParkedRedirect(originalHost: string, finalUrl: string): boolean {
  try {
    const finalHost = new URL(finalUrl).hostname
    if (finalHost === originalHost) return false
    if (PARKING_HOSTS.some((p) => finalHost.includes(p))) return true
    if (finalHost.includes('parking') || finalHost.includes('sedopark')) return true
    return false
  } catch {
    return false
  }
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export interface CheckResult {
  status: 'online' | 'offline'
  responseTimeMs: number
}

export async function checkDomain(url: string): Promise<CheckResult> {
  const normalizedUrl = url.replace(/^http:/, 'https:')
  const start = Date.now()

  try {
    const originalHost = new URL(normalizedUrl).hostname
    const res = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': UA },
    })

    const responseTimeMs = Date.now() - start

    if (res.status >= 500) return { status: 'offline', responseTimeMs }
    if (res.status === 403 || res.status === 410) return { status: 'offline', responseTimeMs }

    if (isParkedRedirect(originalHost, res.url)) {
      return { status: 'offline', responseTimeMs }
    }

    const text = await getTextSnippet(res, 5000)
    return { status: analyzeContent(text), responseTimeMs }
  } catch {
    return { status: 'offline', responseTimeMs: Date.now() - start }
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
