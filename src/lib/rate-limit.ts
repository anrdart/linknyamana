const buckets = new Map<string, { tokens: number; lastRefill: number }>()

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || now - bucket.lastRefill > windowMs) {
    bucket = { tokens: limit, lastRefill: now }
    buckets.set(key, bucket)
  }

  if (bucket.tokens > 0) {
    bucket.tokens--
    return { allowed: true, remaining: bucket.tokens }
  }

  return { allowed: false, remaining: 0 }
}

export function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown'
}

export function rateLimitResponse(retryAfterSec = 60): Response {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSec),
    },
  })
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > 300000) buckets.delete(key)
  }
}, 60000)
