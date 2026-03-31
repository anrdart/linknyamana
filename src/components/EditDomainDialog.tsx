import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle, Globe } from 'lucide-react'
import { type Domain } from '@/data/domains'

interface EditDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domain: Domain | null
  onEdited: () => void
  existingCategories: string[]
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

const normalizeUrl = (url: string): string =>
  url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()

export function EditDomainDialog({
  open,
  onOpenChange,
  domain,
  onEdited,
  existingCategories,
}: EditDomainDialogProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (domain && open) {
      setName(domain.name)
      setUrl(domain.url)
      setCategoryName(domain.category)
      setSaveStatus('idle')
      setErrorMessage('')
    }
  }, [domain, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim() || !categoryName || !domain) return

    setSaveStatus('saving')
    setErrorMessage('')

    try {
      const listRes = await fetch('/api/domains/custom')
      if (!listRes.ok) throw new Error('Failed to fetch domains')

      const { data } = await listRes.json()
      const match = (data || []).find((d: { url: string }) => {
        const normalizedUrl = normalizeUrl(d.url)
        const domainNormalized = normalizeUrl(domain.url)
        return normalizedUrl === domainNormalized
      })

      if (!match) {
        setSaveStatus('error')
        setErrorMessage('Domain tidak ditemukan di database custom')
        setTimeout(() => setSaveStatus('idle'), 3000)
        return
      }

      const res = await fetch('/api/domains/custom', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: match.id,
          name: name.trim(),
          url: url.trim(),
          category_name: categoryName,
        }),
      })

      if (!res.ok) throw new Error('Failed to edit domain')

      setSaveStatus('success')
      setTimeout(() => {
        setSaveStatus('idle')
        onEdited()
        onOpenChange(false)
      }, 1500)
    } catch {
      setSaveStatus('error')
      setErrorMessage('Gagal mengubah domain')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSaveStatus('idle')
      setErrorMessage('')
    }
    onOpenChange(open)
  }

  if (!domain) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-lg">Edit Domain</DialogTitle>
          </div>
          <DialogDescription>
            Ubah detail domain
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-domain-name" className="text-sm font-medium">
              Nama Domain
            </label>
            <input
              id="edit-domain-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-domain-url" className="text-sm font-medium">
              URL
            </label>
            <input
              id="edit-domain-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="contoh: https://example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-domain-category" className="text-sm font-medium">
              Kategori
            </label>
            <select
              id="edit-domain-category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" disabled>
                Pilih kategori...
              </option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={saveStatus === 'saving' || !name.trim() || !url.trim() || !categoryName}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>

            {saveStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Tersimpan!
              </span>
            )}

            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errorMessage || 'Gagal'}
              </span>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
