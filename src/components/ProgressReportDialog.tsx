import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Loader2, BarChart3 } from 'lucide-react'

interface ProgressEntry {
  name: string
  url: string
  category: string
  completed: number
  total: number
  percent: number
  deadline?: string
}

interface ProgressReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProgressReportDialog({ open, onOpenChange }: ProgressReportDialogProps) {
  const [data, setData] = useState<ProgressEntry[]>([])
  const [summary, setSummary] = useState<{ totalDomains: number; completed100: number; avgPercent: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/reports/progress')
      .then(r => r.json())
      .then(d => {
        setData(d.data || [])
        setSummary(d.summary || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Progress Report</DialogTitle>
          </div>
          <DialogDescription>Ringkasan progress setup WordPress semua domain</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {summary && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{summary.totalDomains}</p>
                  <p className="text-xs text-muted-foreground">Total Domain</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{summary.completed100}</p>
                  <p className="text-xs text-muted-foreground">Selesai 100%</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{summary.avgPercent}%</p>
                  <p className="text-xs text-muted-foreground">Rata-rata</p>
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => window.open('/api/reports/progress?format=csv', '_blank')}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>

            <ScrollArea className="h-[400px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-2 py-1.5 text-left">Domain</th>
                    <th className="px-2 py-1.5 text-left">Kategori</th>
                    <th className="px-2 py-1.5 text-right w-20">Progress</th>
                    <th className="px-2 py-1.5 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.url} className="border-b">
                      <td className="px-2 py-1.5 truncate max-w-[200px]">{d.name}</td>
                      <td className="px-2 py-1.5">
                        <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{d.completed}/{d.total}</td>
                      <td className="px-2 py-1.5">
                        <Progress value={d.percent} className="h-1.5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
