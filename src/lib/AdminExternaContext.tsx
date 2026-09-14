// src/lib/AdminExternaContext.tsx
//
// Contexto exclusivo da Administração Externa (ROOT).
// Controla o "escopo" corrente: modo global (todas as Igrejas) ou modo
// filtrado (uma Igreja específica selecionada no seletor global do cabeçalho).
//
// Ao trocar o escopo, atualizamos o rootContext (headers X-Root-Mode /
// X-Church-Id) para que TODAS as chamadas HTTP feitas pelas telas da
// administração externa passem a refletir automaticamente o novo contexto.
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { rootContext } from '@/lib/http'
import { churchesService, type Church } from '@/services/churches.service'

interface AdminExternaContextType {
  mode: 'global' | 'filtered'
  scopeChurchId: string | null
  scopeChurch: Church | null
  churches: Church[]
  loadingChurches: boolean
  setScope: (churchId: string | null) => void
  reloadChurches: () => Promise<void>
}

const AdminExternaContext = createContext<AdminExternaContextType | null>(null)

export function AdminExternaProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'global' | 'filtered'>(rootContext.getMode())
  const [scopeChurchId, setScopeChurchId] = useState<string | null>(rootContext.getChurchId())
  const [churches, setChurches] = useState<Church[]>([])
  const [loadingChurches, setLoadingChurches] = useState(true)

  const reloadChurches = useCallback(async () => {
    setLoadingChurches(true)
    try {
      const list = await churchesService.list({ size: 500 })
      setChurches(list)
    } catch {
      setChurches([])
    } finally {
      setLoadingChurches(false)
    }
  }, [])

  useEffect(() => {
    reloadChurches()
  }, [reloadChurches])

  const setScope = useCallback((churchId: string | null) => {
    if (churchId) {
      rootContext.setFiltered(churchId)
      setMode('filtered')
      setScopeChurchId(churchId)
    } else {
      rootContext.setGlobal()
      setMode('global')
      setScopeChurchId(null)
    }
  }, [])

  const scopeChurch = scopeChurchId
    ? churches.find(c => String(c.id) === scopeChurchId) ?? null
    : null

  return (
    <AdminExternaContext.Provider value={{
      mode, scopeChurchId, scopeChurch, churches, loadingChurches,
      setScope, reloadChurches,
    }}>
      {children}
    </AdminExternaContext.Provider>
  )
}

export function useAdminExterna() {
  const ctx = useContext(AdminExternaContext)
  if (!ctx) throw new Error('useAdminExterna deve ser usado dentro de AdminExternaProvider')
  return ctx
}
