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
  permissions?: string[]
  organizationName?: string
  churchId?: number        // NOVO — vem do login response
  congregationId?: number  // NOVO — vem do login response
  churches?: Church[]
}

interface AppContextType {
  user: User | null
  church: Church | null
  setUser: (user: User | null) => void
  setChurch: (church: Church | null) => void
  loading: boolean
  logout: () => Promise<void>
  isRoot: boolean
  hasPermission: (permission: string) => boolean
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

        // Tentar restaurar igreja salva
        const savedChurchId = localStorage.getItem('igrejahub_selected_church_id')

        // Buscar igrejas disponíveis — o backend aplica o isolamento correto:
        //   ROOT → todas; outros → apenas a própria
        try {
          const res = await http.get<any>('/churches/my')
          const raw = res?.data
          const list = Array.isArray(raw?.data) ? raw.data
                     : Array.isArray(raw)       ? raw
                     : raw?.content             || []

          if (list.length === 1) {
            // Usuário com acesso a uma única igreja: entra direto, sem tela de seleção
            const c = list[0]
            setChurchState({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
          } else if (list.length > 1 && savedChurchId) {
            // ROOT com múltiplas igrejas: restaurar a última seleção
            const found = list.find((c: any) => String(c.id) === savedChurchId)
            if (found) {
              setChurchState({ id: String(found.id), name: found.name, city: found.city || '', state: found.state || '' })
            }
          }
          // Caso list.length > 1 sem savedChurchId: vai para tela de seleção (church === null)
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

  const isRoot = user?.roles?.includes('ROOT') ?? false

  function hasPermission(permission: string): boolean {
    if (isRoot) return true
    return user?.permissions?.includes(permission) ?? false
  }

  return (
    <AppContext.Provider value={{
      user, setUser,
      church, setChurch: setChurchState,
      loading, logout,
      isRoot, hasPermission,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}