import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react'
import { type Domain, type DomainCategory } from '@/data/domains'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'online' | 'offline' | 'checking'

interface StatusSummaryProps {
  categories: DomainCategory[]
  onRefresh: () => void
  isRefreshing: boolean
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
}

export function StatusSummary({
  categories,
  onRefresh,
  isRefreshing,
  activeCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
}: StatusSummaryProps) {
  const allDomains = categories.flatMap((c) => c.domains)
  const online = allDomains.filter((d) => d.status === 'online').length
  const offline = allDomains.filter((d) => d.status === 'offline').length
  const total = allDomains.length

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.name === activeCategory)
    : categories

  const filteredDomains = filteredCategories
    .flatMap((c) => c.domains)
    .filter((d) => statusFilter === 'all' || d.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Domain</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{online}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{offline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              size="sm"
              className="w-full"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border bg-card p-1">
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
    </div>
  )
}
