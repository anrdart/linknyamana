import { useState, useCallback, useEffect, useRef } from 'react'
import { StatusSummary } from '@/components/StatusSummary'
import { DomainCard } from '@/components/DomainCard'
import { DomainDetailDialog } from '@/components/DomainDetailDialog'
import { AddCategoryDialog } from '@/components/AddCategoryDialog'
import { AddDomainDialog } from '@/components/AddDomainDialog'
import { EditDomainDialog } from '@/components/EditDomainDialog'
import { NotificationSettings } from '@/components/NotificationSettings'
import { UserManagement } from '@/components/UserManagement'
import { PasswordChangeDialog } from '@/components/PasswordChangeDialog'
import { BulkImportDialog } from '@/components/BulkImportDialog'
import { ProgressReportDialog } from '@/components/ProgressReportDialog'
import { ConsoleLogDialog } from '@/components/ConsoleLogDialog'
import { AnalyticsPanel } from '@/components/AnalyticsPanel'
import { type Domain, type DomainCategory, WORDPRESS_SETUP_STEPS } from '@/data/domains'
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity, LogOut, Plus, ChevronDown, Archive, Trash2, Pencil, Search, KeyRound, Sun, Moon, Upload, BarChart3, ArrowUpDown, Settings, Bell, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toggleTheme, getTheme } from '@/lib/theme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export interface UserInfo {
  id: string
  username: string
  display_name: string
  role: string
}

function isAdmin(user: UserInfo): boolean {
  return user.role === 'admin'
}

function isEditor(user: UserInfo): boolean {
  return user.role === 'editor'
}

interface DashboardProps {
  user: UserInfo
  onLogout: () => void
}

type StatusFilter = 'all' | 'online' | 'offline' | 'checking'

interface ProgressMap {
  [domainKey: string]: number[]
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [categories, setCategories] = useState<DomainCategory[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [checkProgress, setCheckProgress] = useState({ checked: 0, total: 0 })
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expiryFilter, setExpiryFilter] = useState<string | null>(null)
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [userMgmtOpen, setUserMgmtOpen] = useState(false)
  const [isNotifying, setIsNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null)
  const [addDomainOpen, setAddDomainOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editDomain, setEditDomain] = useState<Domain | null>(null)
  const [editDomainOpen, setEditDomainOpen] = useState(false)
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [viewMode, setViewMode] = useState<'active' | 'archive'>('active')
  const [sidebarFilter, setSidebarFilter] = useState('')
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [progressReportOpen, setProgressReportOpen] = useState(false)
  const [consoleLogOpen, setConsoleLogOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => typeof window !== 'undefined' ? getTheme() === 'dark' : false)
  const [sortBy, setSortBy] = useState<'default' | 'status' | 'expiry' | 'name'>('default')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false)
  const [adminToolsOpen, setAdminToolsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const categoriesRef = useRef(categories)
  categoriesRef.current = categories
  const isRefreshingRef = useRef(isRefreshing)
  isRefreshingRef.current = isRefreshing

  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onEscape: () => {
      setDialogOpen(false)
      setSearchQuery('')
      setSidebarOpen(false)
    },
    onRefresh: () => checkAllStatuses(true),
  })

  const handleToggleDarkMode = () => {
    const next = toggleTheme()
    setDarkMode(next === 'dark')
  }

  const fetchAllProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/progress')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      if (data) {
        const map: ProgressMap = {}
        for (const row of data) {
          map[row.domain_url as string] = row.completed_tasks as number[]
        }
        setProgressMap(map)
      }
    } catch {
      console.error('Failed to fetch progress from API')
    }
  }, [])

  const normalizeUrlForMatching = (url: string): string =>
    url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()

  // Helper to convert date string to YYYY-MM-DD format for input[type="date"]
  const formatDateForInput = (dateValue: string | null | undefined): string | undefined => {
    if (!dateValue) return undefined
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return undefined
    // Use local date components to avoid UTC timezone shift (toISOString converts to UTC)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const fetchDomainMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/domains/meta')
      if (!res.ok) return
      const { data } = await res.json()
      if (!data || !Array.isArray(data)) return

      const metaByUrl = new Map(
        data
          .filter((row: any) => !!row.domain_url)
          .map((row: any) => {
            const normalized = normalizeUrlForMatching(row.domain_url)
            return [
              normalized,
              {
                registrationDate: formatDateForInput(row.registration_date),
                expiryDate: formatDateForInput(row.expiry_date),
                emailNotify: row.email_notify,
              }
            ]
          })
      )

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((domain) => {
            const normalizedDomainUrl = normalizeUrlForMatching(domain.url)
            const meta = metaByUrl.get(normalizedDomainUrl)
            if (!meta) return domain
            return {
              ...domain,
              registrationDate: meta.registrationDate ?? undefined,
              expiryDate: meta.expiryDate ?? undefined,
              emailNotify: meta.emailNotify,
            }
          }),
        }))
      )
    } catch {
      // domain_meta table might not exist yet — that's OK
    }
  }, [])

  const fetchCachedStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/domains/status-cache')
      if (!res.ok) return
      const { data } = await res.json()
      if (!data || !Array.isArray(data)) return

      const cacheByUrl = new Map(
        data
          .filter((row: any) => !!row.domain_url && row.status)
          .map((row: any) => [normalizeUrlForMatching(row.domain_url), { status: row.status as string, cms: row.detected_cms as string | undefined }])
      )

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((domain) => {
            const normalizedDomainUrl = normalizeUrlForMatching(domain.url)
            const cached = cacheByUrl.get(normalizedDomainUrl)
            if (!cached) return domain
            return { ...domain, status: cached.status, cms: cached.cms as Domain['cms'] }
          }),
        }))
      )
    } catch {
      // domain_status table might not exist yet — that's OK
    }
  }, [])

  const fetchDomains = useCallback(async () => {
    try {
      const [domainsRes, categoriesRes, archiveRes] = await Promise.all([
        fetch('/api/domains/custom'),
        fetch('/api/categories/custom'),
        fetch('/api/domains/archive'),
      ])

      if (!domainsRes.ok) throw new Error('Failed to fetch domains')

      const { data: domains } = await domainsRes.json()
      const domainList = domains || []

      let dbCategories: any[] = []
      if (categoriesRes.ok) {
        const { data } = await categoriesRes.json()
        dbCategories = data || []
      }

      let archiveData: any[] = []
      if (archiveRes.ok) {
        const { data } = await archiveRes.json()
        archiveData = data || []
      }

      const archivedUrls = new Set(
        archiveData.map((r: any) => normalizeUrlForMatching(r.domain_url || ''))
      )

      const allCatNames = new Set([
        ...dbCategories.map((c: { name: string }) => c.name),
        ...domainList.map((d: { category_name: string }) => d.category_name),
      ])

      const result: DomainCategory[] = [...allCatNames].map((catName) => {
        const catFromDb = dbCategories.find((c: { name: string }) => c.name === catName)
        return {
          id: catFromDb?.id,
          name: catName,
          icon: catFromDb?.icon || '📁',
          domains: domainList
            .filter((d: { category_name: string }) => d.category_name === catName)
            .map((d: { name: string; url: string; category_name: string; owner: string; archived: boolean }) => ({
              name: d.name,
              url: d.url,
              category: d.category_name,
              owner: d.owner,
              status: 'checking' as const,
              isArchived: d.archived || archivedUrls.has(normalizeUrlForMatching(d.url)),
            })),
        }
      })

      setCategories(result)
    } catch {
      console.error('Failed to fetch domains')
    }
  }, [])

  useEffect(() => {
    fetchDomains()
      .then(() => fetchDomainMeta())
      .then(() => fetchCachedStatus())
      .then(() => fetchAllProgress())
      .finally(() => {
        setInitialLoading(false)
      })

    return () => {}
  }, [])

  const CONCURRENCY = import.meta.env.DEV ? 2 : 5

  const checkAllStatuses = useCallback(async (force = false) => {
    if (isRefreshingRef.current) return

    setIsRefreshing(true)

    const allDomains = categoriesRef.current.flatMap((c) => c.domains)
    const total = allDomains.length
    let checked = 0
    setCheckProgress({ checked: 0, total })

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        domains: cat.domains.map((d) => ({ ...d, status: 'checking' as const })),
      }))
    )

    const abort = new AbortController()
    abortRef.current = abort

    const queue = [...allDomains]

    const worker = async () => {
      while (queue.length > 0 && !abort.signal.aborted) {
        const domain = queue.shift()
        if (!domain) break

        let retries = 0
        const maxRetries = 2

        while (retries <= maxRetries) {
          try {
            const res = await fetch('/api/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: domain.url, force }),
              signal: abort.signal,
            })
            const data = await res.json()
            const status = (data.status ?? 'offline') as 'online' | 'offline'
            const responseTimeMs = data.response_time_ms as number | undefined
            const cms = (data.cms ?? undefined) as Domain['cms']

            setCategories((prev) =>
              prev.map((cat) => ({
                ...cat,
                domains: cat.domains.map((d) =>
                  d.url === domain.url ? { ...d, status, responseTimeMs, cms, lastChecked: new Date() } : d
                ),
              }))
            )
            break
          } catch {
            if (abort.signal.aborted) break
            retries++
            if (retries > maxRetries) {
              setCategories((prev) =>
                prev.map((cat) => ({
                  ...cat,
                  domains: cat.domains.map((d) =>
                    d.url === domain.url ? { ...d, status: 'offline' as const, responseTimeMs: undefined, lastChecked: new Date() } : d
                  ),
                }))
              )
            } else {
              await new Promise((r) => setTimeout(r, 500 * retries))
            }
          }
        }

        checked++
        setCheckProgress({ checked, total })
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    setIsRefreshing(false)
    setCheckProgress({ checked: total, total })
    abortRef.current = null
  }, [])

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      checkAllStatuses(false)
    }, 900000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const deepCheckDomain = useCallback(async (domain: Domain) => {
    const current = categoriesRef.current
      .flatMap((c) => c.domains)
      .find((d) => d.url === domain.url)
    if (!current) return

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        domains: cat.domains.map((d) =>
          d.url === domain.url ? { ...d, status: 'checking' as const } : d
        ),
      }))
    )

    try {
      const res = await fetch('/api/check-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: domain.url }),
      })
      const data = await res.json()
      const status = (data.status ?? 'offline') as 'online' | 'offline'
      const responseTimeMs = data.response_time_ms as number | undefined
      const cms = (data.cms ?? undefined) as Domain['cms']

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((d) =>
            d.url === domain.url ? { ...d, status, responseTimeMs, cms, lastChecked: new Date(), lastDeepChecked: new Date() } : d
          ),
        }))
      )
    } catch {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((d) =>
            d.url === domain.url ? { ...d, status: 'offline' as const, responseTimeMs: undefined, lastChecked: new Date(), lastDeepChecked: new Date() } : d
          ),
        }))
      )
    }
  }, [])

  const handleProgressChange = useCallback((domainUrl: string, completedTasks: number[]) => {
    setProgressMap((prev) => ({ ...prev, [domainUrl]: completedTasks }))
  }, [])

  const handleDomainClick = (domain: Domain) => {
    deepCheckDomain(domain)
    setSelectedDomain(domain)
    setDialogOpen(true)
  }

  const handleNotifyExpiring = useCallback(async () => {
    if (isNotifying) return
    setIsNotifying(true)
    setNotifyResult(null)
    try {
      const res = await fetch('/api/domains/expiring?days=30')
      if (!res.ok) throw new Error('Failed to fetch expiring domains')
      const { data } = await res.json()
      if (!data || data.length === 0) {
        setNotifyResult({ sent: 0, failed: 0 })
        setIsNotifying(false)
        return
      }

      let sent = 0
      let failed = 0
      const allErrors: string[] = []

      const sendOne = async (domain: typeof data[number]) => {
        try {
          const notifRes = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain_url: domain.domain_url,
              domain_name: domain.domain_url.replace(/^https?:\/\//, '').replace(/\/+$/, ''),
              days_remaining: domain.days_remaining,
              registration_date: domain.registration_date,
              expiry_date: domain.expiry_date,
            }),
          })
          const notifData = await notifRes.json()
          if (notifRes.ok) {
            sent += notifData.sent ?? 0
            failed += notifData.failed ?? 0
            if (notifData.errors?.length) allErrors.push(...notifData.errors)
          } else {
            failed++
            allErrors.push(`${domain.domain_url}: API ${notifRes.status}`)
          }
        } catch {
          failed++
          allErrors.push(`${domain.domain_url}: Network error`)
        }
      }

      const BATCH_SIZE = 5
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        await Promise.all(data.slice(i, i + BATCH_SIZE).map(sendOne))
      }
      setNotifyResult({ sent, failed, errors: allErrors.length > 0 ? allErrors : undefined })
    } catch {
      setNotifyResult({ sent: 0, failed: 0 })
    }
    setIsNotifying(false)
  }, [isNotifying])

  const handleArchiveDomain = useCallback(async (domain: Domain) => {
    const newArchived = !domain.isArchived

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        domains: cat.domains.map((d) =>
          normalizeUrlForMatching(d.url) === normalizeUrlForMatching(domain.url)
            ? { ...d, isArchived: newArchived }
            : d
        ),
      }))
    )

    try {
      await fetch('/api/domains/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_url: domain.url, archived: newArchived }),
      })
    } catch {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((d) =>
            normalizeUrlForMatching(d.url) === normalizeUrlForMatching(domain.url)
              ? { ...d, isArchived: !newArchived }
              : d
          ),
        }))
      )
    }
  }, [])

  const handleDeleteDomain = useCallback(async (domain: Domain) => {
    try {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.filter((d) => normalizeUrlForMatching(d.url) !== normalizeUrlForMatching(domain.url)),
        })).filter((cat) => cat.domains.length > 0)
      )

      const res = await fetch('/api/domains/custom')
      if (!res.ok) return
      const { data } = await res.json()
      const match = (data || []).find((d: { url: string }) =>
        normalizeUrlForMatching(d.url) === normalizeUrlForMatching(domain.url)
      )
      if (!match) return

      await fetch('/api/domains/custom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: match.id }),
      })
    } catch {
      fetchDomains()
    }
  }, [fetchDomains])

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    setDeletingCategoryId(categoryId)
    try {
      const res = await fetch('/api/categories/custom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus kategori')
        return
      }
      setConfirmDeleteCategory(null)
      fetchDomains()
    } catch {
      alert('Gagal menghapus kategori')
    } finally {
      setDeletingCategoryId(null)
    }
  }, [fetchDomains])

  const handleEditDomain = useCallback((domain: Domain) => {
    setEditDomain(domain)
    setEditDomainOpen(true)
  }, [])

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.name === activeCategory)
    : categories

  const getFilteredDomains = (cat: DomainCategory) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return cat.domains.filter((d) => {
      if (viewMode === 'archive') {
        if (d.isArchived !== true) return false
      } else {
        if (d.isArchived === true) return false
      }

      if (statusFilter !== 'all' && d.status !== statusFilter) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = d.name.toLowerCase().includes(query)
        const urlMatch = d.url.toLowerCase().includes(query)
        if (!nameMatch && !urlMatch) return false
      }

      if (expiryFilter !== null) {
        if (!d.expiryDate) return false

        const expiry = new Date(d.expiryDate)
        const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (expiryFilter === 'expired') {
          if (expiry >= today) return false
        } else {
          const maxDays = parseInt(expiryFilter, 10)
          if (daysRemaining < 0 || daysRemaining > maxDays) return false
        }
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'status') {
        const order = { offline: 0, checking: 1, online: 2 }
        return (order[a.status] ?? 1) - (order[b.status] ?? 1)
      }
      if (sortBy === 'expiry') {
        const aExp = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity
        const bExp = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity
        return aExp - bExp
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
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
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b p-4">
            <Shield className="h-6 w-6 text-primary" />
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm">LinkNyaMana</h1>
              <p className="text-[10px] text-muted-foreground truncate">{user.display_name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter kategori..."
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-7 pr-2 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeCategory === null && viewMode === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => {
                setActiveCategory(null)
                setViewMode('active')
                setCategoriesExpanded(!categoriesExpanded)
                setSidebarOpen(false)
              }}
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', categoriesExpanded && 'rotate-180')} />
              <LayoutDashboard className="h-4 w-4" />
              <span>Semua Domain</span>
            </button>

            <div className={cn(
              'overflow-hidden transition-all duration-200',
              categoriesExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            )}>
              <div className="pl-4 space-y-1">
                {categories
                  .filter((cat) => cat.name.toLowerCase().includes(sidebarFilter.toLowerCase()))
                  .map((cat) => (
                    <div key={cat.name} className="flex items-center gap-0.5">
                      <button
                        className={cn(
                          'flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors min-w-0',
                          activeCategory === cat.name
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => {
                          setActiveCategory(cat.name)
                          setViewMode('active')
                          setSidebarOpen(false)
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate flex-1 text-left">{cat.name}</span>
                        <span className="text-[10px] opacity-60">{cat.domains.filter(d => d.isArchived !== true).length}</span>
                      </button>
                      {isAdmin(user) && cat.id && (
                        confirmDeleteCategory === cat.id ? (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              className="rounded p-0.5 text-[10px] text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCategory(cat.id!)}
                              disabled={deletingCategoryId === cat.id}
                            >
                              {deletingCategoryId === cat.id ? '...' : 'Ya'}
                            </button>
                            <button
                              className="rounded p-0.5 text-[10px] text-muted-foreground hover:bg-accent"
                              onClick={() => setConfirmDeleteCategory(null)}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDeleteCategory(cat.id!)
                            }}
                            title="Hapus kategori"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'archive'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => {
                setActiveCategory(null)
                setViewMode('archive')
                setSidebarOpen(false)
              }}
            >
              <Archive className="h-4 w-4" />
              <span>Arsip</span>
            </button>
          </nav>

          {isAdmin(user) && (
            <div className="border-t px-3 py-2">
              <button
                onClick={() => setAdminToolsOpen(!adminToolsOpen)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">Kelola</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', adminToolsOpen && 'rotate-180')} />
              </button>
              <div className={cn(
                'overflow-hidden transition-all duration-200',
                adminToolsOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
              )}>
                <div className="space-y-0.5 pl-2">
                  <button onClick={() => { setAddDomainOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Plus className="h-3 w-3" /> Domain
                  </button>
                  <button onClick={() => { setAddCategoryOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Plus className="h-3 w-3" /> Kategori
                  </button>
                  <button onClick={() => { setBulkImportOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Upload className="h-3 w-3" /> Import / Export
                  </button>
                  <button onClick={() => { setProgressReportOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <BarChart3 className="h-3 w-3" /> Progress Report
                  </button>
                  {isAdmin(user) && (
                    <button onClick={() => { setNotifSettingsOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Bell className="h-3 w-3" /> Notifikasi
                    </button>
                  )}
                  {isAdmin(user) && (
                    <button onClick={() => { setUserMgmtOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Shield className="h-3 w-3" /> User
                    </button>
                  )}
                  {isAdmin(user) && (
                    <button onClick={() => { setConsoleLogOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Terminal className="h-3 w-3" /> Console Log
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="shrink-0 border-t px-3 py-2 flex items-center gap-1">
            <button onClick={() => { setPasswordDialogOpen(true); setSidebarOpen(false) }} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" title="Ganti Password">
              <KeyRound className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleToggleDarkMode} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button onClick={onLogout} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Keluar">
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <span className="flex-1" />
            <span className="text-[9px] text-muted-foreground" title="/ search · r refresh · Esc close">
              {user.display_name.split(' ')[0]}
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm truncate">LinkNyaMana</h1>
            <p className="text-[10px] text-muted-foreground truncate">{user.display_name}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {activeCategory ? activeCategory : viewMode === 'archive' ? 'Arsip' : 'Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Halo, {user.display_name} &mdash; {viewMode === 'archive' ? 'Domain yang tidak aktif' : 'Monitor website uptime dan tracking setup progress'}
              </p>
            </div>
          </div>

          <StatusSummary
            categories={categories}
            onRefresh={checkAllStatuses}
            isRefreshing={isRefreshing}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            expiryFilter={expiryFilter}
            onExpiryFilterChange={setExpiryFilter}
            onNotifyExpiring={isAdmin(user) ? handleNotifyExpiring : undefined}
            isNotifying={isNotifying}
            notifyResult={notifyResult}
            isStaffwebdev={isAdmin(user)}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {showAnalytics ? 'Sembunyikan' : 'Tampilkan'} Analytics
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
            >
              <option value="default">Urutan Default</option>
              <option value="status">Urut Status (offline dulu)</option>
              <option value="expiry">Urut Expiry (terdekat dulu)</option>
              <option value="name">Urut Nama (A-Z)</option>
            </select>
          </div>

          {showAnalytics && <AnalyticsPanel />}

          {isRefreshing && checkProgress.total > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-medium">Checking status...</span>
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
                        key={domain.url}
                        domain={domain}
                        completedCount={progressMap[domain.url]?.length ?? 0}
                        totalSteps={WORDPRESS_SETUP_STEPS.length}
                        onClick={handleDomainClick}
                        isStaffwebdev={isAdmin(user)}
                        isArchived={domain.isArchived ?? false}
                        onArchive={handleArchiveDomain}
                        onDelete={handleDeleteDomain}
                        onEdit={handleEditDomain}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        </main>
      </div>

      <DomainDetailDialog
        domain={selectedDomain}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onProgressChange={handleProgressChange}
        initialTasks={selectedDomain ? (progressMap[selectedDomain.url] ?? []) : []}
        onDomainMetaUpdate={(domainUrl, meta) => {
          // Immediately update selectedDomain first (so dialog updates right away)
          setSelectedDomain((prev) => {
            if (!prev || prev.url !== domainUrl) return prev
            return { ...prev, registrationDate: meta.registrationDate, expiryDate: meta.expiryDate, emailNotify: meta.emailNotify }
          })
          // Then update categories
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              domains: cat.domains.map((d) =>
                d.url === domainUrl
                  ? { ...d, registrationDate: meta.registrationDate, expiryDate: meta.expiryDate, emailNotify: meta.emailNotify }
                  : d
              ),
            }))
          )
          // Then fetch from server to ensure sync
          fetchDomainMeta()
        }}
        onCmsChange={(domainUrl, cms) => {
          setSelectedDomain((prev) => (prev && prev.url === domainUrl ? { ...prev, cms } : prev))
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              domains: cat.domains.map((d) => (d.url === domainUrl ? { ...d, cms } : d)),
            }))
          )
        }}
        canEditDates={isAdmin(user)}
      />

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onAdded={() => fetchDomains()}
      />
      <AddDomainDialog
        open={addDomainOpen}
        onOpenChange={setAddDomainOpen}
        onAdded={() => {
          fetchDomains().then(() => fetchDomainMeta()).then(() => checkAllStatuses(false))
        }}
        existingCategories={categories.map((c) => c.name)}
      />
      <EditDomainDialog
        open={editDomainOpen}
        onOpenChange={setEditDomainOpen}
        domain={editDomain}
        onEdited={() => {
          fetchDomains().then(() => fetchDomainMeta())
        }}
        existingCategories={categories.map((c) => c.name)}
      />
      <UserManagement
        open={userMgmtOpen}
        onOpenChange={setUserMgmtOpen}
        allCategories={categories.map((c) => c.name)}
      />
      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
      {notifSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setNotifSettingsOpen(false)}>
          <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Pengaturan Notifikasi</h3>
              <button onClick={() => setNotifSettingsOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <NotificationSettings />
          </div>
        </div>
      )}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImported={() => fetchDomains()}
      />
      <ProgressReportDialog
        open={progressReportOpen}
        onOpenChange={setProgressReportOpen}
      />
      <ConsoleLogDialog
        open={consoleLogOpen}
        onOpenChange={setConsoleLogOpen}
      />
    </div>
  )
}
