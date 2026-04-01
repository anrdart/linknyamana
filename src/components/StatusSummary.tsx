import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, Wifi, WifiOff, RefreshCw, Loader2, Search, Clock, AlertTriangle, Bell } from 'lucide-react'
import { type DomainCategory } from '@/data/domains'

type StatusFilter = 'all' | 'online' | 'offline' | 'checking'

interface StatusSummaryProps {
  categories: DomainCategory[]
  onRefresh: (force?: boolean) => void
  isRefreshing: boolean
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  expiryFilter: string | null
  onExpiryFilterChange: (filter: string | null) => void
  onNotifyExpiring?: () => void
  isNotifying?: boolean
  notifyResult?: { sent: number; failed: number } | null
  isStaffwebdev?: boolean
}

export function StatusSummary({
  categories,
  onRefresh,
  isRefreshing,
  activeCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  expiryFilter,
  onExpiryFilterChange,
  onNotifyExpiring,
  isNotifying,
  notifyResult,
  isStaffwebdev,
}: StatusSummaryProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onSearchQueryChange(localSearch)
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localSearch, onSearchQueryChange])

  const allDomains = categories.flatMap((c) => c.domains).filter((d) => d.isArchived !== true)
  const online = allDomains.filter((d) => d.status === 'online').length
  const offline = allDomains.filter((d) => d.status === 'offline').length
  const total = allDomains.length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiredCount = allDomains.filter((d) => {
    if (!d.expiryDate) return false
    const expiry = new Date(d.expiryDate)
    return expiry < today
  }).length

  const expiringSoonCount = allDomains.filter((d) => {
    if (!d.expiryDate) return false
    const expiry = new Date(d.expiryDate)
    if (expiry < today) return false
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining <= 30
  }).length

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.name === activeCategory)
    : categories

  const filteredDomains = filteredCategories
    .flatMap((c) => c.domains)
    .filter((d) => statusFilter === 'all' || d.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari domain..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Domain</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">{online}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{offline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{expiringSoonCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{expiredCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => onRefresh(true)}
              disabled={isRefreshing}
              size="sm"
              className="w-full"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            {isStaffwebdev && (
              <Button
                onClick={() => onNotifyExpiring?.()}
                disabled={isNotifying || isRefreshing}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isNotifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Check & Notify
              </Button>
            )}
            {notifyResult && (
              <p className="text-[10px] text-muted-foreground">
                <span className="text-green-600">{notifyResult.sent} terkirim</span>
                {notifyResult.failed > 0 && (
                  <>, <span className="text-destructive">{notifyResult.failed} gagal</span></>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onStatusFilterChange('all')}
          >
            All ({total})
          </Badge>
          <Badge
            variant={statusFilter === 'online' ? 'success' : 'outline'}
            className="cursor-pointer"
            onClick={() => onStatusFilterChange('online')}
          >
            Online ({online})
          </Badge>
          <Badge
            variant={statusFilter === 'offline' ? 'destructive' : 'outline'}
            className="cursor-pointer"
            onClick={() => onStatusFilterChange('offline')}
          >
            Offline ({offline})
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge
            variant={activeCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onCategoryChange(null)}
          >
            All Categories
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.name}
              variant={activeCategory === cat.name ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onCategoryChange(cat.name)}
            >
              {cat.icon} {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border bg-card p-1">
        <Badge
          variant={expiryFilter === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onExpiryFilterChange(null)}
        >
          Semua
        </Badge>
        <Badge
          variant={expiryFilter === 'expired' ? 'destructive' : 'outline'}
          className="cursor-pointer"
          onClick={() => onExpiryFilterChange('expired')}
        >
          Expired
        </Badge>
        <Badge
          variant={expiryFilter === '7' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onExpiryFilterChange('7')}
        >
          7 Hari
        </Badge>
        <Badge
          variant={expiryFilter === '14' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onExpiryFilterChange('14')}
        >
          14 Hari
        </Badge>
        <Badge
          variant={expiryFilter === '30' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onExpiryFilterChange('30')}
        >
          30 Hari
        </Badge>
        <Badge
          variant={expiryFilter === '60' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onExpiryFilterChange('60')}
        >
          60 Hari
        </Badge>
      </div>
    </div>
  )
}
