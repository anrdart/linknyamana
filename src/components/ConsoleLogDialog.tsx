import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Terminal, Trash2, Pause, Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  source: string
  message: string
  meta?: Record<string, unknown> | null
  created_at: string
}

interface ConsoleLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const POLL_MS = 3000
const MAX_RENDERED = 500

const levelColor: Record<string, string> = {
  debug: 'text-muted-foreground',
  info: 'text-emerald-500',
  warn: 'text-amber-500',
  error: 'text-red-500',
}

export function ConsoleLogDialog({ open, onOpenChange }: ConsoleLogDialogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [levelFilter, setLevelFilter] = useState<string>('')
  const lastIdRef = useRef<string>('0')
  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const poll = useCallback(async (reset = false) => {
    try {
      const after = reset ? '0' : lastIdRef.current
      const params = new URLSearchParams()
      if (after !== '0') params.set('after', after)
      if (levelFilter) params.set('level', levelFilter)
      params.set('limit', reset ? '200' : '200')

      const res = await fetch(`/api/admin/logs?${params.toString()}`)
      if (!res.ok) return
      const { data, lastId } = await res.json()

      if (reset) {
        setLogs(data || [])
      } else if (data && data.length > 0) {
        setLogs((prev) => {
          const merged = [...prev, ...data]
          return merged.length > MAX_RENDERED ? merged.slice(merged.length - MAX_RENDERED) : merged
        })
      }
      if (lastId) lastIdRef.current = String(lastId)
    } catch {
      /* ignore poll errors */
    }
  }, [levelFilter])

  // Initial load + reload on filter change
  useEffect(() => {
    if (!open) return
    setLoading(true)
    lastIdRef.current = '0'
    poll(true).finally(() => setLoading(false))
  }, [open, levelFilter, poll])

  // Polling loop
  useEffect(() => {
    if (!open) return
    const interval = setInterval(() => {
      if (!pausedRef.current) poll(false)
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [open, poll])

  // Auto-scroll to bottom on new logs (unless paused)
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, paused])

  const handleClear = async () => {
    try {
      await fetch('/api/admin/logs', { method: 'DELETE' })
      setLogs([])
      lastIdRef.current = '0'
    } catch {
      /* ignore */
    }
  }

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('id-ID', { hour12: false })
    } catch {
      return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Console Log</DialogTitle>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn('h-1.5 w-1.5 rounded-full', paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse')} />
              {paused ? 'Paused' : 'Live'}
            </span>
          </div>
          <DialogDescription>Output server global — diperbarui tiap 3 detik</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          >
            <option value="">Semua level</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPaused((p) => !p)}>
            {paused ? <><Play className="h-3 w-3" /> Resume</> : <><Pause className="h-3 w-3" /> Pause</>}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={handleClear}>
            <Trash2 className="h-3 w-3" /> Clear
          </Button>
          <span className="ml-auto text-[10px] text-muted-foreground">{logs.length} baris</span>
        </div>

        <div
          ref={scrollRef}
          className="h-[420px] overflow-y-auto rounded-lg border bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-600">
              Belum ada log. Aktivitas server akan muncul di sini.
            </div>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex gap-2 hover:bg-zinc-900/50 px-1 rounded">
                <span className="text-zinc-600 shrink-0">{fmtTime(entry.created_at)}</span>
                <span className={cn('shrink-0 uppercase font-semibold w-10', levelColor[entry.level] || 'text-zinc-400')}>
                  {entry.level}
                </span>
                <span className="text-sky-400 shrink-0">[{entry.source}]</span>
                <span className="text-zinc-200 break-all">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
