import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

interface BackendCategory { id: number; name: string; type?: string }
interface BackendAccount  { id: number; name: string; bankName?: string; type?: string }

const LOCAL_FIELDS = ['cargos','funcoes','grupos','ministerios','statusMembros',
  'fornecedores','formasPagamento','categoriasPatrimonio','localizacoes','estadosConservacao'] as const

const DEFAULTS = {
  cargos:               ['Pastor(a)','Presbitero','Missionario(a)','Diacono','Diaconisa','Obreiro','Membro'],
  funcoes:              ['Musico','Professor EBD','Tesoureiro(a)','Secretario(a)','Lider de Jovens','Lider de Louvor','Auxiliar'],
  grupos:               ['Grupo de Louvor','Grupo de Jovens','Grupo de Criancas','Grupo de Casais'],
  ministerios:          ['Jovens','Criancas','Uniao de Senhoras','Varons','Acao Social'],
  statusMembros:        ['Ativo','Inativo','Falecido','Congregado','Crianca','Mudou-se','Transferido','Visitante'],
  fornecedores:         ['Fornecedor Exemplo'],
  formasPagamento:      ['Dinheiro','PIX','Cartao de Debito','Cartao de Credito','Cheque','Transferencia Bancaria'],
  categoriasPatrimonio: ['Imoveis','Veiculos','Equipamentos','Instrumentos Musicais','Mobiliario','Eletronicos','Outros'],
  localizacoes:         ['Sala de Culto','Sala de Midia','Escritorio','Salao de Eventos','Estacionamento'],
  estadosConservacao:   ['Otimo','Bom','Regular','Ruim','Inutilizavel'],
}

interface BackendData {
  categoriasFinanceiras: BackendCategory[]
  contasECaixas: BackendAccount[]
}

export type LocalField = typeof LOCAL_FIELDS[number]

export interface ConfigContextType {
  local: typeof DEFAULTS
  addLocal:    (field: LocalField, item: string) => void
  removeLocal: (field: LocalField, item: string) => void
  backend: BackendData
  loadingBackend: boolean
  reloadBackend: () => Promise<void>
  categoriasFinanceiras: string[]
  contasECaixas: string[]
  contasRaw: BackendAccount[]
}

const ConfigCtx = createContext<ConfigContextType | null>(null)

function lsKey(churchId: string, field: string) {
  return `igrejahub_cfg_${churchId}_${field}`
}

function getCurrentChurchId(): string {
  return localStorage.getItem('igrejahub_selected_church_id') || 'default'
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState<typeof DEFAULTS>({ ...DEFAULTS })
  const [backend, setBackend] = useState<BackendData>({
    categoriasFinanceiras: [],
    contasECaixas: [],
  })
  const [loadingBackend, setLoadingBackend] = useState(false)

  useEffect(() => {
    const churchId = getCurrentChurchId()
    const loaded: Partial<typeof DEFAULTS> = {}
    for (const field of LOCAL_FIELDS) {
      const saved = localStorage.getItem(lsKey(churchId, field))
      if (saved) {
        try { (loaded as any)[field] = JSON.parse(saved) } catch {}
      }
    }
    setLocal(prev => ({ ...prev, ...loaded }))
  }, [])

  const loadBackend = useCallback(async () => {
    setLoadingBackend(true)
    try {
      const [catRes, accRes] = await Promise.allSettled([
        http.get<ApiSuccess<any>>('/finance/categories', { page: 0, size: 200 }),
        http.get<ApiSuccess<any>>('/finance/accounts/active'),
      ])
      const catRaw = catRes.status === 'fulfilled' ? catRes.value?.data : null
      const cats: BackendCategory[] = catRaw?.data || catRaw?.content || catRaw || []
      const accRaw = accRes.status === 'fulfilled' ? accRes.value?.data : null
      const accs: BackendAccount[] = Array.isArray(accRaw) ? accRaw : (accRaw?.data || accRaw?.content || [])
      setBackend({ categoriasFinanceiras: cats, contasECaixas: accs })
    } catch {}
    finally { setLoadingBackend(false) }
  }, [])

  useEffect(() => { loadBackend() }, [loadBackend])

  function addLocal(field: LocalField, item: string) {
    const trimmed = item.trim()
    if (!trimmed) return
    const churchId = getCurrentChurchId()
    setLocal(prev => {
      const next = { ...prev, [field]: [...prev[field], trimmed] }
      localStorage.setItem(lsKey(churchId, field), JSON.stringify(next[field]))
      return next
    })
  }

  function removeLocal(field: LocalField, item: string) {
    const churchId = getCurrentChurchId()
    setLocal(prev => {
      const next = { ...prev, [field]: prev[field].filter(i => i !== item) }
      localStorage.setItem(lsKey(churchId, field), JSON.stringify(next[field]))
      return next
    })
  }

  const categoriasFinanceirasEffective = backend.categoriasFinanceiras.length > 0
    ? backend.categoriasFinanceiras.map(c => c.name)
    : ['Dizimo','Oferta','Oferta Alcada','Campanha','Conta de Agua','Conta de Luz','Material de Limpeza','Aluguel','Transferencia','Repasse']

  const contasECaixasEffective = backend.contasECaixas.length > 0
    ? backend.contasECaixas.map(a => a.name)
    : ['Caixa Geral','Banco Bradesco','Banco Itau']

  return (
    <ConfigCtx.Provider value={{
      local,
      addLocal,
      removeLocal,
      backend,
      loadingBackend,
      reloadBackend: loadBackend,
      categoriasFinanceiras: categoriasFinanceirasEffective,
      contasECaixas: contasECaixasEffective,
      contasRaw: backend.contasECaixas,
    }}>
      {children}
    </ConfigCtx.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigCtx)
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider')
  return ctx
}
