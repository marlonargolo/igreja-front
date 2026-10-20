// src/lib/AppContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { http, tokenStore, rootContext, congregationContext } from '@/lib/http'
import { authService } from '@/services/auth.service'
import { congregationsService } from '@/services/congregations.service'

interface Church {
  id: string
  name: string
  city?: string
  state?: string
  logoUrl?: string | null
}

interface Congregation {
  id: string
  name: string
  city?: string
  state?: string
  churchName?: string
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
  /** Chaves dos módulos habilitados para a Igreja do usuário (Admin Externa → Módulos).
   *  undefined = sem restrição (ex.: ROOT sem Igreja selecionada). */
  enabledModules?: string[]
  /** false = restrito só a linkedCongregationIds, nunca vê a Igreja toda (default true). */
  accessMainChurch?: boolean
  /** Congregações vinculadas — só relevante quando accessMainChurch === false. */
  linkedCongregationIds?: number[]
}

interface AppContextType {
  user: User | null
  church: Church | null
  congregation: Congregation | null
  loading: boolean
  isRoot: boolean
  /** true quando a Congregação atual foi "entrada" manualmente (admin de
   *  Igreja navegando dentro dela) — não é a Congregação nativa do usuário,
   *  então é possível "sair" dela. Sempre false para usuário nativo de
   *  Congregação (não há de onde sair). */
  isCongregationEntered: boolean
  setUser: (user: User | null) => void
  setChurch: (church: Church | null) => void
  /**
   * Liga o header X-Congregation-Id (passa a valer para toda a navegação —
   * Tesouraria, Secretaria, etc.) e guarda os dados da Congregação.
   * `exitable: false` é usado só para a Congregação NATIVA do usuário
   * (vem do próprio cadastro) — nesse caso não há "sair" para a Igreja
   * inteira, então isCongregationEntered continua false.
   */
  enterCongregation: (congregation: Congregation, options?: { exitable?: boolean }) => void
  /** Volta para a visão da Igreja inteira. Só faz sentido quando
   *  isCongregationEntered === true. */
  exitCongregation: () => void
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AppContext = createContext<AppContextType | null>(null)

const SELECTED_CHURCH_KEY = 'igrejahub_selected_church_id'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                 = useState<User | null>(null)
  const [church, setChurchState]        = useState<Church | null>(null)
  const [congregation, setCongregation] = useState<Congregation | null>(null)
  const [isCongregationEntered, setIsCongregationEntered] = useState(false)
  const [loading, setLoading]           = useState(true)

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

  /**
   * Entra numa Congregação específica: liga o header X-Congregation-Id
   * (enviado em todos os requests a partir de agora — o backend ignora se o
   * usuário não for elegível) e guarda os dados para exibição.
   */
  function enterCongregation(congregationData: Congregation, options?: { exitable?: boolean }) {
    congregationContext.enter(congregationData.id)
    setCongregation(congregationData)
    setIsCongregationEntered(options?.exitable !== false)
  }

  /** Sai da Congregação "entrada" e volta a ver a Igreja inteira. */
  function exitCongregation() {
    congregationContext.exit()
    setCongregation(null)
    setIsCongregationEntered(false)
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

        // Usuário de uma Congregação específica (nativo, vem do próprio
        // cadastro): nunca há o que escolher — resolve direto, sem passar
        // pela tela de seleção. isCongregationEntered fica false (não há
        // "sair" — essa é a única Congregação que ele pode ver).
        if (me.congregationId && !isRootUser) {
          try {
            const cong = await congregationsService.get(me.congregationId)
            enterCongregation({
              id: String(cong.id),
              name: cong.name,
              city: cong.city || '',
              state: cong.state || '',
              churchName: cong.churchName || '',
            }, { exitable: false })
          } catch {
            // Segue mesmo se falhar — a Igreja ainda é resolvida abaixo
          }
        } else if (!isRootUser && me.accessMainChurch === false && (me.linkedCongregationIds?.length ?? 0) === 1) {
          // Restrito a Congregações vinculadas (nunca vê a Igreja toda) e só
          // tem uma vinculada: resolve direto, igual ao usuário nativo de
          // Congregação — não há mesmo nada mais pra ele escolher.
          try {
            const cong = await congregationsService.get(me.linkedCongregationIds![0])
            enterCongregation({
              id: String(cong.id),
              name: cong.name,
              city: cong.city || '',
              state: cong.state || '',
              churchName: cong.churchName || '',
            }, { exitable: false })
          } catch {
            // Segue mesmo se falhar — a Igreja ainda é resolvida abaixo
          }
        } else if (!isRootUser) {
          // Admin de Igreja: restaura uma Congregação "entrada" antes do
          // recarregamento da página, se houver.
          const enteredId = congregationContext.getId()
          if (enteredId) {
            try {
              const cong = await congregationsService.get(Number(enteredId))
              enterCongregation({
                id: String(cong.id),
                name: cong.name,
                city: cong.city || '',
                state: cong.state || '',
                churchName: cong.churchName || '',
              })
            } catch {
              congregationContext.exit()
            }
          }
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
            setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '', logoUrl: c.logoUrl || null })
          } else if (savedId) {
            // Restaurar Igreja salva
            const found = list.find((c: any) => String(c.id) === savedId)
            if (found) {
              setChurch({ id: String(found.id), name: found.name, city: found.city || '', state: found.state || '', logoUrl: found.logoUrl || null })
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
    congregationContext.exit()
    localStorage.removeItem(SELECTED_CHURCH_KEY)
    setUser(null)
    setChurchState(null)
    setCongregation(null)
    setIsCongregationEntered(false)
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
      congregation, isCongregationEntered,
      enterCongregation, exitCongregation,
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
