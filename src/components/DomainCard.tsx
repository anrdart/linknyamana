import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { CheckCircle2, Archive, Trash2, Pencil, Lock, AlertTriangle, MoreVertical } from 'lucide-react'
import { type Domain } from '@/data/domains'
import { cn } from '@/lib/utils'

interface DomainCardProps {
  domain: Domain
  completedCount: number
  totalSteps: number
  onClick: (domain: Domain) => void
  isStaffwebdev?: boolean
  isArchived?: boolean
  onArchive?: (domain: Domain) => void
  onDelete?: (domain: Domain) => void
  onEdit?: (domain: Domain) => void
  sslExpiryDate?: string
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getExpiryInfo(expiryDate: string | undefined): { days: number; label: string; variant: 'destructive' | 'warning' | 'success' } | null {
  if (!expiryDate) return null

  const expiry = new Date(expiryDate)
  if (isNaN(expiry.getTime())) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const diffMs = expiry.getTime() - now.getTime()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (days < 0) {
    return { days, label: 'Expired', variant: 'destructive' }
  }
  if (days <= 7) {
    return { days, label: `${days}d left`, variant: 'destructive' }
  }
  if (days <= 30) {
    return { days, label: `${days}d left`, variant: 'warning' }
  }
  return { days, label: `${days}d left`, variant: 'success' }
}

function getSslInfo(sslExpiryDate: string | undefined): { daysLeft: number; warning: boolean; expired: boolean } | null {
  if (!sslExpiryDate) return null
  const expiry = new Date(sslExpiryDate)
  if (isNaN(expiry.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { daysLeft, warning: daysLeft <= 30 && daysLeft > 0, expired: daysLeft <= 0 }
}

function getResponseTimeColor(ms: number): string {
  if (ms < 500) return 'text-emerald-600 dark:text-emerald-400'
  if (ms <= 2000) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function DomainCard({
  domain,
  completedCount,
  totalSteps,
  onClick,
  isStaffwebdev,
  isArchived,
  onArchive,
  onDelete,
  onEdit,
  sslExpiryDate
}: DomainCardProps) {
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  const isChecking = domain.status === 'checking'
  const expiryInfo = getExpiryInfo(domain.expiryDate)
  const sslInfo = getSslInfo(sslExpiryDate)

  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online', dotClass: 'bg-emerald-500' },
    offline: { variant: 'destructive' as const, label: 'Offline', dotClass: 'bg-red-500' },
    checking: { variant: 'warning' as const, label: 'Checking...', dotClass: 'bg-amber-500' },
  }

  const config = statusConfig[domain.status]

  return (
    <Card
      className={cn(
        'group transition-all duration-300',
        isArchived
          ? 'opacity-50 pointer-events-none bg-muted/40 border-muted-foreground/20'
          : 'cursor-pointer hover:shadow-md hover:border-primary/30',
        isChecking && !isArchived && 'animate-shimmer',
        !isChecking && !isArchived && 'animate-fade-in-up'
      )}
      onClick={() => { if (!isArchived) onClick(domain) }}
    >
      <CardContent className="p-4">
        {/* Header: name + URL, full width */}
        <div className="min-w-0">
          <p className={cn('font-medium text-sm truncate', isArchived && 'text-muted-foreground')}>{domain.name}</p>
          <p className="text-xs text-muted-foreground truncate">{domain.url}</p>
          {domain.lastDeepChecked && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Deep checked: {formatTimeAgo(domain.lastDeepChecked)}
            </p>
          )}
        </div>

        {/* Info + actions */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {sslInfo && !isArchived && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[10px]',
                  sslInfo.expired ? 'text-red-600 dark:text-red-400' : sslInfo.warning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                )}
                title={sslInfo.expired ? 'SSL expired' : `SSL expires in ${sslInfo.daysLeft}d`}
              >
                {sslInfo.expired || sslInfo.warning ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </span>
            )}
            {domain.responseTimeMs !== undefined && !isArchived && !isChecking && (
              <span className={cn('text-[10px] font-mono', getResponseTimeColor(domain.responseTimeMs))}>
                {domain.responseTimeMs}ms
              </span>
            )}
            {expiryInfo && !isArchived && (
              <Badge
                variant={expiryInfo.variant}
                className="text-[10px] px-1.5 py-0"
              >
                {expiryInfo.label}
              </Badge>
            )}
            <Badge
              variant={isArchived ? 'secondary' : config.variant}
              className={cn(
                'text-[10px] px-1.5 py-0 transition-all duration-300',
                !isChecking && !isArchived && 'animate-status-pop'
              )}
            >
              {isArchived ? 'Diarsipkan' : config.label}
            </Badge>
          </div>

          {isStaffwebdev && (
            <div className="shrink-0 pointer-events-auto">
              {/* Desktop: hover-reveal on active cards; always visible on archived (card is pointer-events-none, can't be hovered) */}
              <div className={cn(
                'hidden sm:flex items-center gap-1 transition-opacity',
                !isArchived && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
              )}>
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive?.(domain) }}
                  title={isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                  aria-label={isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                  className="opacity-60 hover:opacity-100 transition-opacity p-1"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
                {!isArchived && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(domain) }}
                    title="Edit"
                    aria-label="Edit"
                    className="opacity-60 hover:opacity-100 transition-opacity p-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Hapus domain ini?')) {
                      onDelete?.(domain);
                    }
                  }}
                  title="Hapus"
                  aria-label="Hapus"
                  className="text-destructive/60 hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mobile: kebab dropdown */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Aksi domain"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  {/* stopPropagation is required: React portals bubble events up the React tree to the card's onClick */}
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onSelect={() => onArchive?.(domain)}>
                      <Archive className="h-3.5 w-3.5" />
                      {isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                    </DropdownMenuItem>
                    {!isArchived && (
                      <DropdownMenuItem onSelect={() => onEdit?.(domain)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => { if (window.confirm('Hapus domain ini?')) onDelete?.(domain) }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {domain.cms !== 'custom' && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {completedCount}/{totalSteps} steps
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  progress === 100
                    ? 'bg-emerald-500'
                    : progress > 0
                      ? 'bg-blue-500'
                      : 'bg-muted-foreground/30'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
