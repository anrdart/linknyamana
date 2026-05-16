import { useEffect } from 'react'

interface ShortcutHandlers {
  onSearch?: () => void
  onEscape?: () => void
  onRefresh?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'

      if (e.key === 'Escape') {
        handlers.onEscape?.()
        return
      }

      if (isInput) return

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handlers.onSearch?.()
      }

      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handlers.onRefresh?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
