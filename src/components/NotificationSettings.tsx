import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, X, Plus, AlertCircle, Send } from 'lucide-react'

interface NotificationEmail {
  id: string
  email: string
}

interface TelegramConfig {
  bot_token_masked: string
  chat_id: string
  enabled: boolean
}

export function NotificationSettings() {
  const [emails, setEmails] = useState<NotificationEmail[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Telegram state
  const [tgConfig, setTgConfig] = useState<TelegramConfig | null>(null)
  const [tgBotToken, setTgBotToken] = useState('')
  const [tgChatId, setTgChatId] = useState('')
  const [tgEnabled, setTgEnabled] = useState(true)
  const [tgSaving, setTgSaving] = useState(false)
  const [tgTesting, setTgTesting] = useState(false)
  const [tgMessage, setTgMessage] = useState('')
  const [tgLoading, setTgLoading] = useState(false)

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

  const fetchTelegram = useCallback(async () => {
    setTgLoading(true)
    try {
      const res = await fetch('/api/settings/telegram')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setTgConfig(data || null)
      if (data) {
        setTgChatId(data.chat_id)
        setTgEnabled(data.enabled)
      }
    } catch {
      // telegram_config table might not exist yet
    } finally {
      setTgLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmails()
    fetchTelegram()
  }, [fetchEmails, fetchTelegram])

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

      await fetchEmails()
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

  const handleTgSave = async () => {
    if (!tgBotToken.trim() || !tgChatId.trim()) return
    setTgSaving(true)
    setTgMessage('')
    try {
      const res = await fetch('/api/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: tgBotToken.trim(), chat_id: tgChatId.trim(), enabled: tgEnabled }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setTgBotToken('')
      setTgMessage('Tersimpan')
      setTimeout(() => setTgMessage(''), 3000)
      await fetchTelegram()
    } catch {
      setTgMessage('Gagal menyimpan')
      setTimeout(() => setTgMessage(''), 3000)
    } finally {
      setTgSaving(false)
    }
  }

  const handleTgTest = async () => {
    setTgTesting(true)
    setTgMessage('')
    try {
      const res = await fetch('/api/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      })
      const data = await res.json()
      if (data.success) {
        setTgMessage('Test berhasil!')
      } else {
        setTgMessage(data.error || 'Test gagal')
      }
      setTimeout(() => setTgMessage(''), 3000)
    } catch {
      setTgMessage('Test gagal')
      setTimeout(() => setTgMessage(''), 3000)
    } finally {
      setTgTesting(false)
    }
  }

  const handleTgDelete = async () => {
    try {
      await fetch('/api/settings/telegram', { method: 'DELETE' })
      setTgConfig(null)
      setTgBotToken('')
      setTgChatId('')
      setTgEnabled(true)
    } catch {
      setTgMessage('Gagal menghapus')
      setTimeout(() => setTgMessage(''), 3000)
    }
  }

  return (
    <div className="space-y-4">
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
          <AlertCircle className="h-3 w-3" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>

    {/* Telegram Section */}
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Send className="h-4 w-4" />
        <span>Telegram</span>
      </div>

      {tgLoading && !tgConfig && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Memuat...</span>
        </div>
      )}

      {tgConfig && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <div className="text-xs truncate flex-1">
              <span className="text-muted-foreground">Token:</span> {tgConfig.bot_token_masked}
            </div>
            <button
              onClick={handleTgDelete}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <span className="text-xs truncate flex-1">
              <span className="text-muted-foreground">Chat ID:</span> {tgConfig.chat_id}
            </span>
            <span className={`text-[10px] font-medium ${tgConfig.enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
              {tgConfig.enabled ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTgTest}
            disabled={tgTesting}
            className="h-7 w-full text-xs"
          >
            {tgTesting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
            Test
          </Button>
        </div>
      )}

      {!tgConfig && !tgLoading && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={tgBotToken}
            onChange={(e) => setTgBotToken(e.target.value)}
            placeholder="Bot Token"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <input
            type="text"
            value={tgChatId}
            onChange={(e) => setTgChatId(e.target.value)}
            placeholder="Chat ID"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={tgEnabled}
              onChange={(e) => setTgEnabled(e.target.checked)}
              className="rounded border-input"
            />
            Aktifkan notifikasi
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTgSave}
            disabled={tgSaving || !tgBotToken.trim() || !tgChatId.trim()}
            className="h-7 w-full text-xs"
          >
            {tgSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simpan'}
          </Button>
        </div>
      )}

      {tgMessage && (
        <div className="text-xs text-muted-foreground">{tgMessage}</div>
      )}
    </div>
    </div>
  )
}
