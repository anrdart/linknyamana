import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, Archive, Trash2, Pencil } from 'lucide-react'
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

export function DomainCard({ 
  domain, 
  completedCount, 
  totalSteps, 
  onClick, 
  isStaffwebdev, 
  isArchived, 
  onArchive, 
  onDelete,
  onEdit
}: DomainCardProps) {
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  const isChecking = domain.status === 'checking'
  const expiryInfo = getExpiryInfo(domain.expiryDate)

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
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors duration-500',
                  isArchived ? 'bg-muted-foreground/40' : config.dotClass
                )}
              />
              {isChecking && !isArchived && (
                <Loader2 className="absolute -top-0.5 -left-0.5 h-3.5 w-3.5 animate-spin text-amber-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className={cn('font-medium text-sm truncate', isArchived && 'text-muted-foreground')}>{domain.name}</p>
              <p className="text-xs text-muted-foreground truncate">{domain.url}</p>
              {domain.lastDeepChecked && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Deep checked: {formatTimeAgo(domain.lastDeepChecked)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 flex-wrap">
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
            <div className="flex items-center gap-1 ml-1 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onArchive?.(domain) }}
                title={isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                className="opacity-50 hover:opacity-100 transition-opacity p-1"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
              {!isArchived && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(domain) }}
                  title="Edit"
                  className="opacity-50 hover:opacity-100 transition-opacity p-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {isArchived && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.confirm('Hapus domain ini?')) {
                      onDelete?.(domain);
                    }
                  }}
                  title="Hapus"
                  className="text-destructive/50 hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

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
      </CardContent>
    </Card>
  )
}
