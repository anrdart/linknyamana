import { useState, useEffect } from 'react'
import LoginPage from '@/components/LoginPage'
import Dashboard, { type UserInfo } from '@/components/Dashboard'

export default function AppShell() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch {
        // not logged in
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  const handleLogin = (u: UserInfo) => {
    setUser(u)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  if (loading) {
    return null
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}
