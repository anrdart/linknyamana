import { useState, useCallback, useEffect, useRef } from 'react'
import { StatusSummary } from '@/components/StatusSummary'
import { DomainCard } from '@/components/DomainCard'
import { DomainDetailDialog } from '@/components/DomainDetailDialog'
import { domainCategories, type Domain, WORDPRESS_SETUP_STEPS } from '@/data/domains'
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'online' | 'offline' | 'checking'

interface ProgressMap {
  [domainName: string]: number[]
}

export default function Dashboard() {
  const [categories, setCategories] = useState(domainCategories)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [checkProgress, setCheckProgress] = useState({ checked: 0, total: 0 })
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchAllProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/progress')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      if (data) {
        const map: ProgressMap = {}
        for (const row of data) {
          map[row.domain_name as string] = row.completed_tasks as number[]
        }
        setProgressMap(map)
      }
    } catch {
      console.error('Failed to fetch progress from API')
    }
  }, [])

  useEffect(() => {
    fetchAllProgress().finally(() => setInitialLoading(false))

    refreshTimerRef.current = setInterval(() => {
      checkAllStatuses()
    }, 900000)

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const checkAllStatuses = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)

    const allDomains = categories.flatMap((c) => c.domains)
    const total = allDomains.length
    setCheckProgress({ checked: 0, total })

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        domains: cat.domains.map((d) => ({ ...d, status: 'checking' as const })),
      }))
    )

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: allDomains.map((d) => d.url) }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'result') {
              const { url, status, checked, total: t } = event as {
                url: string
                status: 'online' | 'offline'
                checked: number
                total: number
              }
              setCheckProgress({ checked, total: t })

              const urlKey = url as string
              setCategories((prev) =>
                prev.map((cat) => ({
                  ...cat,
                  domains: cat.domains.map((d) =>
                    d.url === urlKey
                      ? { ...d, status, lastChecked: new Date() }
                      : d
                  ),
                }))
              )
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch {
      if (!abort.signal.aborted) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            domains: cat.domains.map((d) => ({ ...d, status: 'offline' as const })),
          }))
        )
      }
    }

    setIsRefreshing(false)
    setCheckProgress((prev) => ({ checked: prev.total, total: prev.total }))
    abortRef.current = null
  }, [categories, isRefreshing])

  useEffect(() => {
    checkAllStatuses()
  }, [])

  const handleDomainClick = (domain: Domain) => {
    setSelectedDomain(domain)
    setDialogOpen(true)
  }

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.name === activeCategory)
    : categories

  const getFilteredDomains = (cat: typeof domainCategories[number]) => {
    return cat.domains.filter(
      (d) => statusFilter === 'all' || d.status === statusFilter
    )
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-lg font-medium">Loading Dashboard...</span>
          </div>
          <p className="text-sm text-muted-foreground">Connecting to monitoring service</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b p-4">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-bold text-sm">LinkNyaMana</h1>
              <p className="text-[10px] text-muted-foreground">Web Management Dashboard</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => {
                setActiveCategory(null)
                setSidebarOpen(false)
              }}
            >
              <LayoutDashboard className="h-4 w-4" />
              All Domains
            </button>

            {categories.map((cat) => (
              <button
                key={cat.name}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  activeCategory === cat.name
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => {
                  setActiveCategory(cat.name)
                  setSidebarOpen(false)
                }}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto text-xs opacity-60">{cat.domains.length}</span>
              </button>
            ))}
          </nav>

          <div className="border-t p-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground">
                Auto-refresh every 15 minutes
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {activeCategory ? activeCategory : 'Dashboard'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor website uptime and track WordPress setup progress
            </p>
          </div>

          <StatusSummary
            categories={categories}
            onRefresh={checkAllStatuses}
            isRefreshing={isRefreshing}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {/* Checking progress bar */}
          {isRefreshing && checkProgress.total > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-medium">
                    Checking status...
                  </span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {checkProgress.checked} / {checkProgress.total} domains
                </span>
              </div>
              <Progress
                value={(checkProgress.checked / checkProgress.total) * 100}
                className="h-2"
              />
            </div>
          )}

          <div className="space-y-6">
            {filteredCategories.map((cat) => {
              const filteredDomains = getFilteredDomains(cat)
              if (filteredDomains.length === 0) return null

              return (
                <div key={cat.name}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <h3 className="text-base font-semibold">{cat.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      ({filteredDomains.length} domain{filteredDomains.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredDomains.map((domain) => (
                      <DomainCard
                        key={domain.name}
                        domain={domain}
                        completedCount={progressMap[domain.name]?.length ?? 0}
                        totalSteps={WORDPRESS_SETUP_STEPS.length}
                        onClick={handleDomainClick}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <DomainDetailDialog
        domain={selectedDomain}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
