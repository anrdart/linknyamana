import { useState, useEffect } from 'react'

/**
 * Media-query hook. Lazily initializes from `window.matchMedia` on the first
 * render so the correct value is available before paint (no flash). The
 * Dashboard island is client-only, so `window` always exists here; the
 * `typeof window` guard is defensive only.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** True when viewport is tablet-or-wider (>=768px, Tailwind `md`). */
export function useIsTabletUp(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/** True when viewport is desktop-or-wider (>=1024px, Tailwind `lg`). */
export function useIsDesktopUp(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
