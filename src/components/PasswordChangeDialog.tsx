import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle, KeyRound } from 'lucide-react'

interface PasswordChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordChangeDialog({ open, onOpenChange }: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setStatus('idle')
    setErrorMessage('')
  }

  const handleSubmit = async () => {
    setErrorMessage('')

    if (newPassword.length < 6) {
      setErrorMessage('Password baru minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok')
      return
    }

    setStatus('saving')

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengubah password')
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
        return
      }

      setStatus('success')
      setTimeout(() => {
        reset()
        onOpenChange(false)
      }, 1500)
    } catch {
      setErrorMessage('Gagal mengubah password')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset()
    onOpenChange(newOpen)
  }

  const canSubmit =
    status === 'idle' &&
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-lg">Ganti Password</DialogTitle>
          </div>
          <DialogDescription>Masukkan password lama dan password baru</DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30 rounded-md px-3 py-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>Password berhasil diubah</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Password Lama</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="********"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Min. 6 karakter"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ulangi password baru"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {status === 'saving' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
