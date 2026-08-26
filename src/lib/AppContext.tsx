// src/lib/AppContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { http, tokenStore } from '@/lib/http'
import { authService } from '@/services/auth.service'

interface Church {
  id: string
  name: string
  city?: string
  state?: string
}

interface User {
  id: string
  name: string
  email: string
  roles?: string[]
  organizationName?: string
  churches?: Church[]
}

interface AppContextType {
  user: User | null
  church: Church | null
  setUser: (user: User | null) => void
  setChurch: (church: Church | null) => void
  loading: boolean
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [church, setChurch] = useState<Church | null>(null)
  const [loading, setLoading] = useState(true)

  function setChurchState(churchData: Church | null) {
    setChurch(churchData)
    if (churchData) {
      localStorage.setItem('igrejahub_selected_church_id', churchData.id)
    } else {
      localStorage.removeItem('igrejahub_selected_church_id')
    }
  }

  useEffect(() => {
    async function bootstrap() {
      if (!authService.isAuthenticated()) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.me()
        setUser(me)

        const savedChurchId = localStorage.getItem('igrejahub_selected_church_id')
        if (savedChurchId) {
          const restored = me.churches?.find((c: any) => String(c.id) === savedChurchId)
          if (restored) {
            setChurchState({ id: String(restored.id), name: restored.name, city: restored.city || '', state: restored.state || '' })
            setLoading(false)
            return
          }
        }

        try {
          const res = await http.get<any>('/churches/my')
          const raw = res.data
          const list = Array.isArray(raw) ? raw : (raw?.data || raw?.content || [])
          if (list.length === 1) {
            const c = list[0]
            setChurchState({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
          }
        } catch {}

      } catch {
        tokenStore.clear()
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  async function logout() {
    try { await authService.logout() } catch {}
    tokenStore.clear()
    localStorage.removeItem('igrejahub_selected_church_id')
    setUser(null)
    setChurch(null)
    window.location.href = '/login'
  }

  return (
    <AppContext.Provider value={{ user, setUser, church, setChurch: setChurchState, loading, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}