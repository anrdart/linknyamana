import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { WordPressChecklist } from '@/components/WordPressChecklist'
import { type Domain, WORDPRESS_SETUP_STEPS } from '@/data/domains'
import { Globe, ExternalLink, Calendar, Loader2, Check, AlertCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DomainDetailDialogProps {
  domain: Domain | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProgressChange?: (domainName: string, completedTasks: number[]) => void
  initialTasks?: number[]
  onDomainMetaUpdate?: (
    domainUrl: string,
    meta: { registrationDate: string; expiryDate: string; emailNotify: boolean }
  ) => void
  onCmsChange?: (domainUrl: string, cms: 'wordpress' | 'custom' | 'unknown') => void
  canEditDates?: boolean
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export function DomainDetailDialog({
  domain,
  open,
  onOpenChange,
  onProgressChange,
  initialTasks,
  onDomainMetaUpdate,
  onCmsChange,
  canEditDates = false,
}: DomainDetailDialogProps) {
  const [registrationDate, setRegistrationDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [emailNotify, setWhatsappNotify] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState('')
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [whoisError, setWhoisError] = useState('')
  const [cmsSaving, setCmsSaving] = useState(false)

  // Helper to convert date string or Date object to YYYY-MM-DD format for input[type="date"]
  const formatDateForInput = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return ''
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    if (isNaN(date.getTime())) return ''
    // Use local date components to avoid UTC timezone shift (toISOString converts to UTC)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    if (domain) {
      setRegistrationDate(formatDateForInput(domain.registrationDate))
      setExpiryDate(formatDateForInput(domain.expiryDate))
      setWhatsappNotify(domain.emailNotify ?? true)
      setSaveError('')
      // Don't override saveStatus if it's currently showing success/error (let it expire via setTimeout)
      setSaveStatus((prev) => (prev === 'success' || prev === 'error' ? prev : 'idle'))
    }
  }, [domain])

  if (!domain) return null

  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online' },
    offline: { variant: 'destructive' as const, label: 'Offline' },
    checking: { variant: 'warning' as const, label: 'Checking...' },
  }

  const config = statusConfig[domain.status]

  const handleSaveDates = async () => {
    setSaveStatus('saving')
    setSaveError('')
    try {
      const res = await fetch('/api/domains/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain_url: domain.url,
          registration_date: registrationDate || null,
          expiry_date: expiryDate || null,
          email_notify: emailNotify,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error || `HTTP ${res.status}`)
      }

      setSaveStatus('success')
      onDomainMetaUpdate?.(domain.url, {
        registrationDate,
        expiryDate,
        emailNotify,
      })

      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError((err as Error)?.message || 'Gagal menyimpan')
      setTimeout(() => { setSaveStatus('idle'); setSaveError('') }, 5000)
    }
  }

  const handleCmsOverride = async (value: 'wordpress' | 'custom' | 'auto') => {
    if (!domain) return
    setCmsSaving(true)
    try {
      const res = await fetch('/api/domains/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_url: domain.url, cms: value }),
      })
      if (res.ok) {
        // 'auto' clears override → falls back to auto-detected value (unknown until next scan)
        const effective = value === 'auto' ? 'unknown' : value
        onCmsChange?.(domain.url, effective)
      }
    } catch {
      // ignore — UI keeps previous value
    } finally {
      setCmsSaving(false)
    }
  }

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
          <Badge variant={config.variant}>{config.label}</Badge>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Tanggal Domain</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Informasi tanggal registrasi dan expired domain
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="registration-date" className="text-sm font-medium">
                Tanggal Registrasi
              </label>
              <input
                id="registration-date"
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                readOnly={!canEditDates}
                disabled={!canEditDates}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  !canEditDates && "opacity-70 cursor-not-allowed"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="expiry-date" className="text-sm font-medium">
                Tanggal Expired
              </label>
              <input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                readOnly={!canEditDates}
                disabled={!canEditDates}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  !canEditDates && "opacity-70 cursor-not-allowed"
                )}
              />
            </div>
          </div>

          {canEditDates && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setWhoisLoading(true)
                    setWhoisError('')
                    try {
                      const res = await fetch('/api/domains/whois', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain_url: domain.url }),
                      })
                      const result = await res.json()
                      if (!res.ok) {
                        setWhoisError(result.error || 'WHOIS lookup failed')
                      } else if (result.data) {
                        if (result.data.registrationDate) setRegistrationDate(result.data.registrationDate)
                        if (result.data.expiryDate) setExpiryDate(result.data.expiryDate)
                      }
                    } catch {
                      setWhoisError('Network error')
                    }
                    setWhoisLoading(false)
                  }}
                  disabled={whoisLoading}
                >
                  {whoisLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Search className="h-3.5 w-3.5 mr-1" />
                  )}
                  Auto-fill WHOIS
                </Button>
                {whoisError && (
                  <span className="text-xs text-destructive">{whoisError}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="whatsapp-notify"
                  checked={emailNotify}
                  onCheckedChange={(checked) => setWhatsappNotify(checked === true)}
                />
                <label htmlFor="whatsapp-notify" className="text-sm">
                  Notifikasi Email saat domain hampir expired
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleSaveDates}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Tanggal'
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
                    {saveError || 'Gagal menyimpan'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {canEditDates && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-3">
            <div className="min-w-0">
              <p className="text-xs font-medium">Tipe CMS</p>
              <p className="text-[10px] text-muted-foreground">
                Ubah manual jika deteksi otomatis salah
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {cmsSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              <select
                value={domain.cms === 'custom' ? 'custom' : domain.cms === 'wordpress' ? 'wordpress' : 'auto'}
                onChange={(e) => handleCmsOverride(e.target.value as 'wordpress' | 'custom' | 'auto')}
                disabled={cmsSaving}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="auto">Auto-detect</option>
                <option value="wordpress">WordPress</option>
                <option value="custom">Non-WordPress</option>
              </select>
            </div>
          </div>
        )}

        {domain.cms !== 'custom' && (
          <>
            <div className="space-y-1 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  WordPress Setup Checklist ({WORDPRESS_SETUP_STEPS.length} steps)
                </h4>
                {domain.cms === 'wordpress' && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">WordPress</span>
                )}
                {domain.cms === 'unknown' && (
                  <span className="text-[10px] text-muted-foreground">CMS belum terdeteksi</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Track your WordPress setup progress. Klik baris untuk menandai selesai. Perubahan tersimpan otomatis.
              </p>
            </div>

            <WordPressChecklist
              domainUrl={domain.url}
              initialTasks={initialTasks}
              onProgressChange={onProgressChange}
            />
          </>
        )}

        {domain.cms === 'custom' && (
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Domain ini menggunakan framework non-WordPress</p>
            <p className="text-xs text-muted-foreground mt-1">WordPress checklist tidak ditampilkan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
