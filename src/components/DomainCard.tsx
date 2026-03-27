import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { type Domain } from '@/data/domains'
import { cn } from '@/lib/utils'

interface DomainCardProps {
  domain: Domain
  completedCount: number
  totalSteps: number
  onClick: (domain: Domain) => void
}

export function DomainCard({ domain, completedCount, totalSteps, onClick }: DomainCardProps) {
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  const isChecking = domain.status === 'checking'

  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online', dotClass: 'bg-emerald-500' },
    offline: { variant: 'destructive' as const, label: 'Offline', dotClass: 'bg-red-500' },
    checking: { variant: 'warning' as const, label: 'Checking...', dotClass: 'bg-amber-500' },
  }

  const config = statusConfig[domain.status]

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/30',
        isChecking && 'animate-shimmer',
        !isChecking && 'animate-fade-in-up'
      )}
      onClick={() => onClick(domain)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors duration-500',
                  config.dotClass
                )}
              />
              {isChecking && (
                <Loader2 className="absolute -top-0.5 -left-0.5 h-3.5 w-3.5 animate-spin text-amber-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{domain.name}</p>
              <p className="text-xs text-muted-foreground truncate">{domain.url}</p>
            </div>
          </div>
          <Badge
            variant={config.variant}
            className={cn(
              'shrink-0 text-[10px] px-1.5 py-0 transition-all duration-300',
              !isChecking && 'animate-status-pop'
            )}
          >
            {config.label}
          </Badge>
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
