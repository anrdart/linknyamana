import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, X, Plus, AlertCircle } from 'lucide-react'

interface NotificationEmail {
  id: string
  email: string
}

export function NotificationSettings() {
  const [emails, setEmails] = useState<NotificationEmail[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/notifications')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setEmails(data || [])
    } catch {
      setErrorMessage('Gagal memuat email')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleAdd = async () => {
    if (!newEmail.trim()) return
    setAdding(true)
    setErrorMessage('')
    const email = newEmail.trim()

    const optimisticId = crypto.randomUUID()
    setEmails((prev) => [...prev, { id: optimisticId, email }])
    setNewEmail('')

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.status === 409) {
        setEmails((prev) => prev.filter((e) => e.id !== optimisticId))
        setNewEmail(email)
        setErrorMessage('Email sudah ada')
        setTimeout(() => setErrorMessage(''), 3000)
        return
      }

      if (!res.ok) throw new Error('Failed to add')

      const result = await res.json()
      if (result.id) {
        setEmails((prev) => prev.map((e) => (e.id === optimisticId ? { id: result.id, email } : e)))
      }
    } catch {
      setEmails((prev) => prev.filter((e) => e.id !== optimisticId))
      setNewEmail(email)
      setErrorMessage('Gagal menambahkan email')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setErrorMessage('')
    const backup = [...emails]

    setEmails((prev) => prev.filter((e) => e.id !== id))

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) throw new Error('Failed to delete')
    } catch {
      setEmails(backup)
      setErrorMessage('Gagal menghapus email')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>Email Notifikasi</span>
      </div>

      {loading && emails.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Memuat...</span>
        </div>
      )}

      {emails.length > 0 && (
        <div className="space-y-1">
          {emails.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5"
            >
              <span className="text-xs truncate flex-1">{item.email}</span>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="email@domain.com"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={adding || !newEmail.trim()}
          className="h-7 shrink-0 px-2 text-xs"
        >
          {adding ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 h-3" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
