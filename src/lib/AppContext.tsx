import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { authService, type AuthChurch, type AuthUser } from '@/services/auth.service'
import { tokenStore } from '@/lib/http'

const SELECTED_CHURCH_KEY = 'igrejahub_selected_church_id'

interface AppState {
  user: AuthUser | null
  loading: boolean
  church: AuthChurch | null
  setChurch: (c: AuthChurch) => void
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AppCtx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [church, setChurchState] = useState<AuthChurch | null>(null)
  const [loading, setLoading] = useState(true)

  // Ao carregar o app, se já existe access token válido, recupera o usuário
  // autenticado via GET /auth/me (seção 11, passo 5).
  useEffect(() => {
    async function bootstrap() {
      if (!authService.isAuthenticated()) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.me()
        setUser(me)
        const savedChurchId = localStorage.getItem(SELECTED_CHURCH_KEY)
        const restored = me.churches.find((c) => c.id === savedChurchId)
        if (restored) setChurchState(restored)
      } catch {
        tokenStore.clear()
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  async function login(email: string, password: string, remember = true) {
    const authUser = await authService.login({ email, password, remember })
    setUser(authUser)
  }

  async function logout() {
    await authService.logout()
    setUser(null)
    setChurchState(null)
    localStorage.removeItem(SELECTED_CHURCH_KEY)
  }

  // O contexto de igreja escolhido é persistido localmente, mas o backend
  // deve sempre revalidar em cada chamada que o usuário tem escopo para essa
  // igreja/congregação (seção 3 e 18 — nunca confiar apenas no cliente).
  function setChurch(c: AuthChurch) {
    setChurchState(c)
    localStorage.setItem(SELECTED_CHURCH_KEY, c.id)
  }

  return (
    <AppCtx.Provider value={{ user, loading, church, setChurch, login, logout }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}