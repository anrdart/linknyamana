import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { WordPressChecklist } from '@/components/WordPressChecklist'
import { type Domain, WORDPRESS_SETUP_STEPS } from '@/data/domains'
import { Globe, ExternalLink } from 'lucide-react'

interface DomainDetailDialogProps {
  domain: Domain | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DomainDetailDialog({ domain, open, onOpenChange }: DomainDetailDialogProps) {
  if (!domain) return null

  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online' },
    offline: { variant: 'destructive' as const, label: 'Offline' },
    checking: { variant: 'warning' as const, label: 'Checking...' },
  }

  const config = statusConfig[domain.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-lg">{domain.name}</DialogTitle>
          </div>
          <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{domain.url}</span>
            <a
              href={domain.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Visit
            </a>
          </DialogDescription>
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        </DialogHeader>

        <div className="space-y-1 rounded-lg bg-muted/50 p-3">
          <h4 className="text-sm font-semibold">
            WordPress Setup Checklist ({WORDPRESS_SETUP_STEPS.length} steps)
          </h4>
          <p className="text-xs text-muted-foreground">
            Track your WordPress setup progress. Changes are saved automatically to the database.
          </p>
        </div>

        <WordPressChecklist domainName={domain.name} />
      </DialogContent>
    </Dialog>
  )
}
