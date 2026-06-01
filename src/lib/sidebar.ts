const STORAGE_KEY = 'sidebar-collapsed'

/**
 * Returns the user's explicit collapse preference, or null if they have
 * never toggled (in which case the breakpoint default applies).
 */
export function getSidebarPref(): boolean | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'true') return true
  if (v === 'false') return false
  return null
}

export function setSidebarPref(collapsed: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false')
}

/** Toggle from a known current state; returns the new collapsed value. */
export function toggleSidebarPref(current: boolean): boolean {
  const next = !current
  setSidebarPref(next)
  return next
}
