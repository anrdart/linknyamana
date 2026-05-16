export async function checkSsl(
  hostname: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    await fetch(`https://${hostname}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    })
    return { valid: true }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'SSL check failed',
    }
  }
}
