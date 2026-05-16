import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Users, Shield, Plus, Trash2, Pencil, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleBadge = (role: string) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    admin: { variant: 'default', label: 'Admin' },
    editor: { variant: 'secondary', label: 'Editor' },
    viewer: { variant: 'outline', label: 'Viewer' },
  }
  const c = config[role] || config.viewer
  return <Badge variant={c.variant} className="text-[9px] px-1.5 py-0 h-4">{c.label}</Badge>
}

interface User {
  id: string
  username: string
  display_name: string
  role: string
}

interface UserManagementProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allCategories: string[]
}

type Tab = 'users' | 'categories'
type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export function UserManagement({ open, onOpenChange, allCategories }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [errorMessage, setErrorMessage] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('editor')
  const [addStatus, setAddStatus] = useState<SaveStatus>('idle')

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingDisplayName, setEditingDisplayName] = useState('')
  const [editStatus, setEditStatus] = useState<SaveStatus>('idle')

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null)
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null)

  const [selectedUsername, setSelectedUsername] = useState('')
  const [userCategories, setUserCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoryUpdates, setCategoryUpdates] = useState<Record<string, boolean>>({})

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setUsers(data || [])
      setSelectedUsername((prev) => {
        if (prev) return prev
        return data && data.length > 0 ? data[0].username : ''
      })
    } catch {
      setErrorMessage('Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserCategories = useCallback(async (username: string) => {
    if (!username) return
    setLoadingCategories(true)
    try {
      const res = await fetch(`/api/users/categories?username=${encodeURIComponent(username)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setUserCategories((data || []).map((c: { category_name: string }) => c.category_name))
      setCategoryUpdates({})
    } catch {
      setErrorMessage('Gagal memuat kategori user')
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchUsers()
      setErrorMessage('')
      setActiveTab('users')
      setShowAddForm(false)
      setNewUsername('')
      setNewDisplayName('')
      setNewPassword('')
      setAddStatus('idle')
      setEditingUserId(null)
      setEditStatus('idle')
      setConfirmDeleteUserId(null)
      setDeletingUserId(null)
    }
  }, [open, fetchUsers])

  useEffect(() => {
    if (activeTab === 'categories' && selectedUsername) {
      fetchUserCategories(selectedUsername)
    }
  }, [activeTab, selectedUsername, fetchUserCategories])

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()) return
    setAddStatus('saving')
    setErrorMessage('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          display_name: newDisplayName.trim(),
          password: newPassword,
          role: newRole,
        }),
      })

      if (res.status === 409) {
        setErrorMessage('Username sudah ada')
        setAddStatus('error')
        setTimeout(() => { setAddStatus('idle'); setErrorMessage('') }, 3000)
        return
      }

      if (!res.ok) throw new Error('Failed to add')

      setAddStatus('success')
      setTimeout(() => {
        setNewUsername('')
        setNewDisplayName('')
        setNewPassword('')
        setNewRole('editor')
        setShowAddForm(false)
        setAddStatus('idle')
        fetchUsers()
      }, 1000)
    } catch {
      setErrorMessage('Gagal menambahkan user')
      setAddStatus('error')
      setTimeout(() => { setAddStatus('idle'); setErrorMessage('') }, 3000)
    }
  }

  const handleEditDisplayName = async (userId: string) => {
    if (!editingDisplayName.trim()) return
    setEditStatus('saving')
    setErrorMessage('')

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, display_name: editingDisplayName.trim() }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setEditStatus('success')
      setTimeout(() => {
        setEditingUserId(null)
        setEditStatus('idle')
        fetchUsers()
      }, 1000)
    } catch {
      setErrorMessage('Gagal mengubah display name')
      setEditStatus('error')
      setTimeout(() => setEditStatus('idle'), 3000)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId)
    setErrorMessage('')

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      })

      if (!res.ok) throw new Error('Failed to delete')

      setConfirmDeleteUserId(null)
      fetchUsers()
    } catch {
      setErrorMessage('Gagal menghapus user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRoleUserId(userId)
    setErrorMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      fetchUsers()
    } catch {
      setErrorMessage('Gagal mengubah role')
    } finally {
      setUpdatingRoleUserId(null)
    }
  }

  const handleCategoryToggle = async (categoryName: string, checked: boolean) => {
    setCategoryUpdates((prev) => ({ ...prev, [categoryName]: true }))

    try {
      if (checked) {
        const res = await fetch('/api/users/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: selectedUsername, category_name: categoryName }),
        })
        if (!res.ok) throw new Error('Failed to add')
        setUserCategories((prev) => [...prev, categoryName])
      } else {
        const res = await fetch('/api/users/categories', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: selectedUsername, category_name: categoryName }),
        })
        if (!res.ok) throw new Error('Failed to remove')
        setUserCategories((prev) => prev.filter((c) => c !== categoryName))
      }
    } catch {
      setErrorMessage('Gagal mengubah kategori')
    } finally {
      setCategoryUpdates((prev) => {
        const next = { ...prev }
        delete next[categoryName]
        return next
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setErrorMessage('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-lg">Manajemen User</DialogTitle>
          </div>
          <DialogDescription>
            Kelola user dan penugasan kategori
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'users'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'categories'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Assign Kategori
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-4">
            <div className="rounded-md border divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingDisplayName}
                          onChange={(e) => setEditingDisplayName(e.target.value)}
                          className="flex-1 rounded border border-input bg-background px-2 py-0.5 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditDisplayName(user.id)
                            if (e.key === 'Escape') setEditingUserId(null)
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleEditDisplayName(user.id)} disabled={editStatus === 'saving'} className="text-muted-foreground hover:text-foreground">
                          {editStatus === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{user.display_name}</span>
                        <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                      </div>
                    )}
                  </div>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updatingRoleUserId === user.id}
                    className="rounded border border-input bg-background px-1.5 py-0.5 text-[10px] shrink-0"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => { setEditingUserId(user.id); setEditingDisplayName(user.display_name) }}
                    className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {confirmDeleteUserId === user.id ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleDeleteUser(user.id)} disabled={deletingUserId === user.id} className="text-[10px] text-destructive font-medium">
                        {deletingUserId === user.id ? '...' : 'Ya'}
                      </button>
                      <button onClick={() => setConfirmDeleteUserId(null)} className="text-[10px] text-muted-foreground">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteUserId(user.id)} className="text-muted-foreground hover:text-destructive shrink-0 p-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {showAddForm ? (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    placeholder="Username"
                  />
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    placeholder="Nama Tampilan"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    placeholder="Password"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={handleAddUser}
                    disabled={addStatus === 'saving' || !newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()}
                  >
                    {addStatus === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> : addStatus === 'success' ? <Check className="h-3 w-3" /> : 'Simpan'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewUsername('')
                      setNewDisplayName('')
                      setNewPassword('')
                      setNewRole('editor')
                      setAddStatus('idle')
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
                Tambah User
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pilih User</label>
              <select
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {users.length === 0 && (
                  <option value="" disabled>Tidak ada user</option>
                )}
                {users.map((user) => (
                  <option key={user.id} value={user.username}>
                    {user.display_name} ({user.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Kategori yang Diassign</label>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : allCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Tidak ada kategori</p>
              ) : (
                <div className="rounded-md border bg-card max-h-60 overflow-y-auto">
                  <div className="divide-y">
                    {allCategories.map((category) => {
                      const isAssigned = userCategories.includes(category)
                      const isUpdating = categoryUpdates[category]
                      return (
                        <label
                          key={category}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={(checked) => handleCategoryToggle(category, checked === true)}
                            />
                          )}
                          <span className="text-sm">{category}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
