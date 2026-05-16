export function withCacheHeaders(body: string, maxAge: number): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `private, max-age=${maxAge}`,
    },
  })
}
