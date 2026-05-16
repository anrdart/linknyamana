const RDAP_SERVERS: Record<string, string> = {
  'com': 'https://rdap.verisign.com/com/v1/domain/',
  'net': 'https://rdap.verisign.com/net/v1/domain/',
  'org': 'https://rdap.org/domain/',
  'id': 'https://rdap.pandi.or.id/domain/',
  'info': 'https://rdap.afilias.net/rdap/v1/domain/',
  'biz': 'https://rdap.afilias.net/rdap/v1/domain/',
  'io': 'https://rdap.nic.io/domain/',
  'co': 'https://rdap.nic.co/domain/',
  'me': 'https://rdap.nic.me/domain/',
  'xyz': 'https://rdap.nic.xyz/domain/',
}

function getRdapUrl(hostname: string): string {
  const parts = hostname.split('.')
  // Try full TLD first (e.g., "web.id", "my.id", "sch.id")
  if (parts.length >= 3) {
    const sld = parts.slice(-2).join('.')
    if (RDAP_SERVERS[sld]) return RDAP_SERVERS[sld] + hostname
  }
  const tld = parts[parts.length - 1]
  if (RDAP_SERVERS[tld]) return RDAP_SERVERS[tld] + hostname
  // Fallback to rdap.org redirect
  return `https://rdap.org/domain/${hostname}`
}

function parseEvents(data: any): { registrationDate?: string; expiryDate?: string } {
  const events = data.events || []
  const registration = events.find((e: any) => e.eventAction === 'registration')
  const expiry = events.find((e: any) => e.eventAction === 'expiration')
  return {
    registrationDate: registration?.eventDate?.split('T')[0],
    expiryDate: expiry?.eventDate?.split('T')[0],
  }
}

export async function fetchRdapData(
  domainUrl: string
): Promise<{ registrationDate?: string; expiryDate?: string } | null> {
  try {
    const hostname = new URL(domainUrl).hostname
    const url = getRdapUrl(hostname)

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/rdap+json, application/json' },
    })
    if (!res.ok) return null

    const data = await res.json()
    const result = parseEvents(data)
    if (result.registrationDate || result.expiryDate) return result

    return null
  } catch {
    return null
  }
}
