export async function fetchRdapData(
  domainUrl: string
): Promise<{ registrationDate?: string; expiryDate?: string } | null> {
  try {
    const hostname = new URL(domainUrl).hostname
    const res = await fetch(`https://rdap.org/domain/${hostname}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const events = data.events || []
    const registration = events.find(
      (e: any) => e.eventAction === 'registration'
    )
    const expiry = events.find((e: any) => e.eventAction === 'expiration')
    return {
      registrationDate: registration?.eventDate?.split('T')[0],
      expiryDate: expiry?.eventDate?.split('T')[0],
    }
  } catch {
    return null
  }
}
