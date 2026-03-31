import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle, FolderPlus } from 'lucide-react'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export function AddCategoryDialog({ open, onOpenChange, onAdded }: AddCategoryDialogProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaveStatus('saving')
    setErrorMessage('')

    try {
      const res = await fetch('/api/categories/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim() || '📁' }),
      })

      if (res.status === 409) {
        setSaveStatus('error')
        setErrorMessage('Kategori sudah ada')
        return
      }

      if (!res.ok) throw new Error('Failed to add category')

      setSaveStatus('success')
      setTimeout(() => {
        setName('')
        setIcon('')
        setSaveStatus('idle')
        onAdded()
        onOpenChange(false)
      }, 1500)
    } catch {
      setSaveStatus('error')
      setErrorMessage('Gagal menambahkan kategori')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('')
      setIcon('')
      setSaveStatus('idle')
      setErrorMessage('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-lg">Tambah Kategori</DialogTitle>
          </div>
          <DialogDescription>
            Tambah kategori baru untuk mengelompokkan domain
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="category-name" className="text-sm font-medium">
              Nama Kategori
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Portfolio"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category-icon" className="text-sm font-medium">
              Ikon
            </label>
            <input
              id="category-icon"
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📌"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">Emoji opsional, default: 📁</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={saveStatus === 'saving' || !name.trim()}
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
