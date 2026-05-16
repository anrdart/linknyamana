const RDAP_SERVERS: Record<string, string> = {
  // gTLDs
  'com': 'https://rdap.verisign.com/com/v1/domain/',
  'net': 'https://rdap.verisign.com/net/v1/domain/',
  'org': 'https://rdap.publicinterestregistry.org/rdap/domain/',
  'info': 'https://rdap.afilias.net/rdap/v1/domain/',
  'biz': 'https://rdap.afilias.net/rdap/v1/domain/',
  'io': 'https://rdap.nic.io/domain/',
  'co': 'https://rdap.nic.co/domain/',
  'me': 'https://rdap.nic.me/domain/',
  'xyz': 'https://rdap.nic.xyz/domain/',
  'dev': 'https://rdap.nic.google/domain/',
  'app': 'https://rdap.nic.google/domain/',
  'site': 'https://rdap.centralnic.com/site/domain/',
  'online': 'https://rdap.centralnic.com/online/domain/',
  'store': 'https://rdap.centralnic.com/store/domain/',
  'tech': 'https://rdap.centralnic.com/tech/domain/',
  'work': 'https://rdap.centralnic.com/work/domain/',
  // Indonesian ccTLDs — all managed by PANDI
  'id': 'https://rdap.pandi.or.id/domain/',
  'web.id': 'https://rdap.pandi.or.id/domain/',
  'my.id': 'https://rdap.pandi.or.id/domain/',
  'sch.id': 'https://rdap.pandi.or.id/domain/',
  'co.id': 'https://rdap.pandi.or.id/domain/',
  'or.id': 'https://rdap.pandi.or.id/domain/',
  'ac.id': 'https://rdap.pandi.or.id/domain/',
  'go.id': 'https://rdap.pandi.or.id/domain/',
  'biz.id': 'https://rdap.pandi.or.id/domain/',
  'ponpes.id': 'https://rdap.pandi.or.id/domain/',
  'desa.id': 'https://rdap.pandi.or.id/domain/',
}

function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.')
  // Check 2-part TLD first (web.id, my.id, sch.id, co.id, etc.)
  if (parts.length >= 3) {
    const tld2 = parts.slice(-2).join('.')
    if (RDAP_SERVERS[tld2]) return parts.slice(-3).join('.')
  }
  // Single TLD
  return parts.slice(-2).join('.')
}

function getRdapUrl(hostname: string): string {
  const registrable = getRegistrableDomain(hostname)
  const parts = hostname.split('.')

  // Try 2-part TLD
  if (parts.length >= 3) {
    const tld2 = parts.slice(-2).join('.')
    if (RDAP_SERVERS[tld2]) return RDAP_SERVERS[tld2] + registrable
  }
  // Single TLD
  const tld = parts[parts.length - 1]
  if (RDAP_SERVERS[tld]) return RDAP_SERVERS[tld] + registrable
  // Fallback
  return `https://rdap.org/domain/${registrable}`
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
