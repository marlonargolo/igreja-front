// src/lib/AppContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { http, tokenStore, rootContext } from '@/lib/http'
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
  churchId?: number
  congregationId?: number
  churches?: Church[]
}

interface AppContextType {
  user: User | null
  church: Church | null
  loading: boolean
  isRoot: boolean
  setUser: (user: User | null) => void
  setChurch: (church: Church | null) => void
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AppContext = createContext<AppContextType | null>(null)

const SELECTED_CHURCH_KEY = 'igrejahub_selected_church_id'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser]          = useState<User | null>(null)
  const [church, setChurchState] = useState<Church | null>(null)
  const [loading, setLoading]    = useState(true)

  const isRoot = user?.roles?.includes('ROOT') ?? false

  /**
   * Selecionar uma Igreja:
   *   - Persiste no localStorage para restaurar ao recarregar
   *   - Para ROOT: configura rootContext com modo filtered + churchId
   *     → os headers X-Root-Mode e X-Church-Id passam a ser enviados em todos os requests
   *   - Para não-ROOT: apenas atualiza o estado local (churchId já está no JWT)
   */
  function setChurch(churchData: Church | null) {
    setChurchState(churchData)

    if (churchData) {
      localStorage.setItem(SELECTED_CHURCH_KEY, churchData.id)
      // ROOT: informa ao backend via header qual Igreja está sendo gerenciada
      rootContext.setFiltered(churchData.id)
    } else {
      localStorage.removeItem(SELECTED_CHURCH_KEY)
      rootContext.setGlobal()
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

        const isRootUser = me.roles?.includes('ROOT') ?? false

        // Tentar restaurar Igreja salva
        const savedId = localStorage.getItem(SELECTED_CHURCH_KEY)
        if (savedId) {
          // Configurar o rootContext ANTES de fazer qualquer request
          // para que /churches/my já use o header correto
          if (isRootUser) rootContext.setFiltered(savedId)
        } else {
          if (isRootUser) rootContext.setGlobal()
        }

        // Buscar igrejas disponíveis
        try {
          const res = await http.get<any>('/churches/my')
          const raw = res?.data
          const list: any[] = Array.isArray(raw?.data) ? raw.data
                            : Array.isArray(raw)       ? raw
                            : raw?.content             || []

          if (list.length === 1 && !savedId) {
            // Uma única Igreja disponível → entrar direto
            const c = list[0]
            setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
          } else if (savedId) {
            // Restaurar Igreja salva
            const found = list.find((c: any) => String(c.id) === savedId)
            if (found) {
              setChurch({ id: String(found.id), name: found.name, city: found.city || '', state: found.state || '' })
            }
          }
          // Caso contrário → vai para tela de seleção (church === null)
        } catch {}

      } catch {
        tokenStore.clear()
        rootContext.clear()
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  async function logout() {
    try { await authService.logout() } catch {}
    tokenStore.clear()
    rootContext.clear()
    localStorage.removeItem(SELECTED_CHURCH_KEY)
    setUser(null)
    setChurchState(null)
    window.location.href = '/login'
  }

  function hasPermission(permission: string): boolean {
    if (isRoot) return true
    return user?.permissions?.includes(permission) ?? false
  }

  return (
    <AppContext.Provider value={{
      user, setUser,
      church, setChurch,
      loading, isRoot,
      logout, hasPermission,
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