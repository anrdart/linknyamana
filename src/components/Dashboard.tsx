import { useState, useCallback, useEffect, useRef } from 'react'
import { StatusSummary } from '@/components/StatusSummary'
import { DomainCard } from '@/components/DomainCard'
import { DomainDetailDialog } from '@/components/DomainDetailDialog'
import { AddCategoryDialog } from '@/components/AddCategoryDialog'
import { AddDomainDialog } from '@/components/AddDomainDialog'
import { EditDomainDialog } from '@/components/EditDomainDialog'
import { NotificationSettings } from '@/components/NotificationSettings'
import { UserManagement } from '@/components/UserManagement'
import { userDomains, type Domain, type DomainCategory, WORDPRESS_SETUP_STEPS } from '@/data/domains'
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity, LogOut, Plus, ChevronDown, Archive, Trash2, Pencil, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface UserInfo {
  id: string
  username: string
  display_name: string
  role: string
}

interface DashboardProps {
  user: UserInfo
  onLogout: () => void
}

type StatusFilter = 'all' | 'online' | 'offline' | 'checking'

interface ProgressMap {
  [domainName: string]: number[]
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
  const [notifyResult, setNotifyResult] = useState<{ sent: number; failed: number } | null>(null)
  const [addDomainOpen, setAddDomainOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editDomain, setEditDomain] = useState<Domain | null>(null)
  const [editDomainOpen, setEditDomainOpen] = useState(false)
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [viewMode, setViewMode] = useState<'active' | 'archive'>('active')
  const [sidebarFilter, setSidebarFilter] = useState('')
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
                whatsappNotify: row.whatsapp_notify,
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
              whatsappNotify: meta.whatsappNotify,
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

      const statusByUrl = new Map(
        data
          .filter((row: any) => !!row.domain_url && row.status)
          .map((row: any) => [normalizeUrlForMatching(row.domain_url), row.status as string])
      )

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((domain) => {
            const normalizedDomainUrl = normalizeUrlForMatching(domain.url)
            const cachedStatus = statusByUrl.get(normalizedDomainUrl)
            if (!cachedStatus) return domain
            return { ...domain, status: cachedStatus }
          }),
        }))
      )
    } catch {
      // domain_status table might not exist yet — that's OK
    }
  }, [])

  const fetchCustomData = useCallback(async () => {
    try {
      const [domainsRes, categoriesRes, archiveRes] = await Promise.all([
        fetch('/api/domains/custom'),
        fetch('/api/categories/custom'),
        fetch('/api/domains/archive'),
      ])

      if (!domainsRes.ok) {
        throw new Error('Failed to fetch custom domains')
      }

      const { data: customDomains } = await domainsRes.json()
      const domains = customDomains || []

      let categories: any[] = []
      if (categoriesRes.ok) {
        const { data: customCategories } = await categoriesRes.json()
        categories = customCategories || []
      }

      let archiveData: any[] = []
      if (archiveRes.ok) {
        const archiveJson = await archiveRes.json()
        archiveData = archiveJson?.data || []
      }

      const archivedUrls = new Set(
        archiveData.map((r: any) => {
          const normalized = r.domain_url?.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
          return normalized
        })
      )

      if (Array.isArray(domains)) {
        const allCatNames = new Set([
          ...categories.map((c: { name: string }) => c.name),
          ...domains.map((d: { category_name: string }) => d.category_name),
        ])

        const customCats: DomainCategory[] = [...allCatNames].map((catName) => {
          const catFromDb = categories.find((c: { name: string; icon: string }) => c.name === catName)
          return {
            name: catName,
            icon: catFromDb?.icon || '📁',
            domains: domains
              .filter((d: { category_name: string }) => d.category_name === catName)
              .map((d: { name: string; url: string; category_name: string; owner: string; archived: boolean }) => ({
                name: d.name,
                url: d.url,
                category: d.category_name,
                owner: d.owner,
                status: 'checking' as const,
                isArchived: d.archived ?? false,
              })),
          }
        })

        setCategories((prev) => {
          const existingNames = new Set(prev.map((c) => c.name))
          const newCats = customCats.filter((c) => !existingNames.has(c.name))

          const merged = prev.map((existingCat) => {
            const customCat = customCats.find((c) => c.name === existingCat.name)
            if (!customCat) return existingCat

            const existingNormalizedUrls = new Set(existingCat.domains.map((d) => normalizeUrlForMatching(d.url)))
            const newDomains = customCat.domains.filter((d) => !existingNormalizedUrls.has(normalizeUrlForMatching(d.url)))
            if (newDomains.length === 0) return existingCat

            return {
              ...existingCat,
              domains: [...existingCat.domains, ...newDomains],
            }
          })

          const withArchive = [...merged, ...newCats].map((cat) => ({
            ...cat,
            domains: cat.domains.map((d) => ({
              ...d,
              isArchived: d.isArchived || archivedUrls.has(normalizeUrlForMatching(d.url)),
            })),
          }))

          return withArchive
        })
      }
    } catch {
      console.error('Failed to fetch custom data from API')
    }
  }, [])

  const fetchUserCategories = useCallback(async () => {
    if (user.username === 'staffwebdev') {
      const allCats = Object.values(userDomains).flat()
      const merged: DomainCategory[] = []
      for (const cat of allCats) {
        const existing = merged.find((m) => m.name === cat.name)
        if (!existing) {
          merged.push({ ...cat, domains: [...cat.domains] })
        } else {
          const existingUrls = new Set(existing.domains.map((d) => normalizeUrlForMatching(d.url)))
          for (const d of cat.domains) {
            if (!existingUrls.has(normalizeUrlForMatching(d.url))) {
              existing.domains.push(d)
            }
          }
        }
      }
      setCategories(merged)
      return
    }

    try {
      const res = await fetch('/api/users/categories?username=' + encodeURIComponent(user.username))
      if (!res.ok) {
        setCategories(userDomains[user.username] ?? [])
        return
      }
      const { data } = await res.json()
      const assignedCatNames = new Set((data || []).map((r: { category_name: string }) => r.category_name))

      const allCats = Object.values(userDomains).flat()
      const merged: DomainCategory[] = []
      for (const cat of allCats) {
        if (!assignedCatNames.has(cat.name)) continue
        const existing = merged.find((m) => m.name === cat.name)
        if (!existing) {
          merged.push({ ...cat, domains: [...cat.domains] })
        } else {
          const existingUrls = new Set(existing.domains.map((d) => normalizeUrlForMatching(d.url)))
          for (const d of cat.domains) {
            if (!existingUrls.has(normalizeUrlForMatching(d.url))) {
              existing.domains.push(d)
            }
          }
        }
      }
      setCategories(merged)
    } catch {
      setCategories(userDomains[user.username] ?? [])
    }
  }, [user.username])

  useEffect(() => {
    fetchUserCategories()
      .then(() => fetchCustomData())
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
    if (isRefreshing) return

    setIsRefreshing(true)

    const allDomains = categories.flatMap((c) => c.domains)
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

            setCategories((prev) =>
              prev.map((cat) => ({
                ...cat,
                domains: cat.domains.map((d) =>
                  d.url === domain.url ? { ...d, status, lastChecked: new Date() } : d
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
                    d.url === domain.url ? { ...d, status: 'offline' as const, lastChecked: new Date() } : d
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
  }, [categories, isRefreshing])

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      checkAllStatuses(false)
    }, 900000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [checkAllStatuses])

  const deepCheckDomain = useCallback(async (domain: Domain) => {
    const current = categories
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

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((d) =>
            d.url === domain.url ? { ...d, status, lastChecked: new Date(), lastDeepChecked: new Date() } : d
          ),
        }))
      )
    } catch {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          domains: cat.domains.map((d) =>
            d.url === domain.url ? { ...d, status: 'offline' as const, lastChecked: new Date(), lastDeepChecked: new Date() } : d
          ),
        }))
      )
    }
  }, [categories])

  const handleProgressChange = useCallback((domainName: string, completedTasks: number[]) => {
    setProgressMap((prev) => ({ ...prev, [domainName]: completedTasks }))
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
      for (const domain of data) {
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
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }
      setNotifyResult({ sent, failed })
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
      const res = await fetch('/api/domains/custom')
      if (!res.ok) return
      const { data } = await res.json()
      const match = (data || []).find((d: { url: string }) => {
        const normalizedUrl = d.url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
        const domainNormalized = domain.url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
        return normalizedUrl === domainNormalized
      })
      if (!match) return

      await fetch('/api/domains/custom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: match.id }),
      })

      await fetchCustomData()
    } catch {
      console.error('Failed to delete domain')
    }
  }, [fetchCustomData])

  const handleEditDomain = useCallback((domain: Domain) => {
    setEditDomain(domain)
    setEditDomainOpen(true)
  }, [])

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.name === activeCategory)
    : categories

  const getFilteredDomains = (cat: typeof userDomains[string][number]) => {
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
                    <button
                      key={cat.name}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors',
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

          {user.username === 'staffwebdev' && (
            <div className="border-t p-3 space-y-1">
              <button
                onClick={() => { setAddCategoryOpen(true); setSidebarOpen(false) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </button>
              <button
                onClick={() => { setAddDomainOpen(true); setSidebarOpen(false) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tambah Domain
              </button>
              <button
                onClick={() => { setUserMgmtOpen(true); setSidebarOpen(false) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Shield className="h-4 w-4" />
                Management User
              </button>
            </div>
          )}

          <div className="border-t p-3 space-y-2">
            {user.username === 'staffwebdev' && (
              <NotificationSettings />
            )}
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground">
                Auto-refresh every 15 minutes
              </p>
            </div>
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
            onNotifyExpiring={user.username === 'staffwebdev' ? handleNotifyExpiring : undefined}
            isNotifying={isNotifying}
            notifyResult={notifyResult}
            isStaffwebdev={user.username === 'staffwebdev'}
          />

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
                        completedCount={progressMap[domain.name]?.length ?? 0}
                        totalSteps={WORDPRESS_SETUP_STEPS.length}
                        onClick={handleDomainClick}
                        isStaffwebdev={user.username === 'staffwebdev'}
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
        initialTasks={selectedDomain ? (progressMap[selectedDomain.name] ?? []) : []}
        onDomainMetaUpdate={(domainUrl, meta) => {
          // Immediately update selectedDomain first (so dialog updates right away)
          setSelectedDomain((prev) => {
            if (!prev || prev.url !== domainUrl) return prev
            return { ...prev, registrationDate: meta.registrationDate, expiryDate: meta.expiryDate, whatsappNotify: meta.whatsappNotify }
          })
          // Then update categories
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              domains: cat.domains.map((d) =>
                d.url === domainUrl
                  ? { ...d, registrationDate: meta.registrationDate, expiryDate: meta.expiryDate, whatsappNotify: meta.whatsappNotify }
                  : d
              ),
            }))
          )
          // Then fetch from server to ensure sync
          fetchDomainMeta()
        }}
        canEditDates={user.username === 'staffwebdev'}
      />

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onAdded={() => fetchCustomData()}
      />
      <AddDomainDialog
        open={addDomainOpen}
        onOpenChange={setAddDomainOpen}
        onAdded={() => {
          fetchCustomData().then(() => fetchDomainMeta()).then(() => checkAllStatuses(false))
        }}
        existingCategories={categories.map((c) => c.name)}
      />
      <EditDomainDialog
        open={editDomainOpen}
        onOpenChange={setEditDomainOpen}
        domain={editDomain}
        onEdited={() => {
          fetchCustomData().then(() => fetchDomainMeta())
        }}
        existingCategories={categories.map((c) => c.name)}
      />
      <UserManagement
        open={userMgmtOpen}
        onOpenChange={setUserMgmtOpen}
        allCategories={categories.map((c) => c.name)}
      />
    </div>
  )
}
