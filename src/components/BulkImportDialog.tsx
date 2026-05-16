import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, Check, AlertCircle, Download } from 'lucide-react'
import Papa from 'papaparse'

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

interface ParsedDomain {
  name: string
  url: string
  category_name: string
}

export function BulkImportDialog({ open, onOpenChange, onImported }: BulkImportDialogProps) {
  const [parsed, setParsed] = useState<ParsedDomain[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const domains = (results.data as any[])
          .filter(r => r.name && r.url && r.category_name)
          .map(r => ({ name: String(r.name).trim(), url: String(r.url).trim(), category_name: String(r.category_name).trim() }))
        if (domains.length === 0) {
          setError('CSV harus punya kolom: name, url, category_name')
          return
        }
        setParsed(domains)
      },
      error: () => setError('Gagal parse CSV'),
    })
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    try {
      const res = await fetch('/api/domains/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult({ imported: data.imported, skipped: data.skipped })
      onImported()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const handleExport = () => {
    window.open('/api/domains/export', '_blank')
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setParsed([])
      setResult(null)
      setError('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import / Export Domain</DialogTitle>
          <DialogDescription>Upload CSV atau export data domain</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={handleExport} className="w-full">
            <Download className="h-4 w-4" /> Export CSV
          </Button>

          <div className="border-t pt-4">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="w-full">
              <Upload className="h-4 w-4" /> Pilih File CSV
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1">Kolom: name, url, category_name</p>
          </div>

          {parsed.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{parsed.length} domain siap diimport:</p>
              <div className="max-h-40 overflow-y-auto rounded border text-xs">
                {parsed.slice(0, 10).map((d, i) => (
                  <div key={i} className="px-2 py-1 border-b last:border-0">
                    {d.name} — {d.url} [{d.category_name}]
                  </div>
                ))}
                {parsed.length > 10 && <div className="px-2 py-1 text-muted-foreground">...dan {parsed.length - 10} lainnya</div>}
              </div>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : `Import ${parsed.length} domain`}
              </Button>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Imported: {result.imported}, Skipped: {result.skipped}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
