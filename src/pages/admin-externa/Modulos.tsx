// src/pages/admin-externa/Modulos.tsx
//
// Painel operacional dos módulos: com uma Igreja selecionada no seletor
// global, cada módulo vira um atalho pra entrar direto nas funções daquela
// Igreja (ex.: abrir a Contabilidade dela), em vez de só ligar/desligar um
// interruptor. O que está liberado pra cada Igreja continua vindo do plano
// contratado dela (Administração Externa → Assinatura); esta tela não
// habilita nada, só navega.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Blocks, AlertCircle, ArrowRight } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { useApp } from '@/lib/AppContext'
import { adminService, type SystemModule } from '@/services/admin.service'

// Tela de destino de cada módulo, dentro do layout normal da Igreja.
const MODULE_ROUTES: Record<string, string> = {
  SECRETARIA: '/membros',
  TESOURARIA: '/tesouraria/receitas',
  PATRIMONIO: '/patrimonio',
  CONTABILIDADE: '/contabilidade/fechamento',
  SUPORTE: '/suporte/chamados',
}

export default function Modulos() {
  const navigate = useNavigate()
  const { mode, scopeChurch } = useAdminExterna()
  const { setChurch } = useApp()
  const [modules, setModules] = useState<SystemModule[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setUnavailable(false)
    try {
      const list = await adminService.modules()
      setModules(list)
      if (list.length === 0) setUnavailable(true)
    } catch { setUnavailable(true) }
    setLoading(false)
  }

  function operate(mod: SystemModule) {
    if (!scopeChurch) return
    const route = MODULE_ROUTES[mod.key]
    if (!route) return
    setChurch({
      id: String(scopeChurch.id), name: scopeChurch.name,
      city: scopeChurch.city || '', state: scopeChurch.state || '', logoUrl: scopeChurch.logoUrl || null,
    })
    navigate(route)
  }

  return (
    <AdminExternaLayout crumbs={[{ label: 'Módulos' }]} title="Módulos">
      {mode === 'global' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Selecione uma Igreja no seletor do topo para operar os módulos dela diretamente por aqui.
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-brand-300">Carregando...</div>
      ) : unavailable ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center gap-2 text-brand-400">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="font-semibold text-brand-900">Nenhum módulo retornado pelo backend.</p>
            <p className="text-sm">O catálogo de módulos ainda não está disponível nesta instalação.</p>
          </div>
        </Card>
      ) : modules.length === 0 ? (
        <EmptyState title="Nenhum módulo cadastrado" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => (
            <Card key={mod.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Blocks className="h-4 w-4 text-brand-400" /> {mod.name}</CardTitle>
              </CardHeader>
              <CardBody className="pt-1">
                {mod.description && <p className="text-sm text-brand-400 mb-3">{mod.description}</p>}
                {scopeChurch ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => operate(mod)}>
                    Operar em {scopeChurch.name} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <p className="text-xs text-brand-300">Selecione uma igreja para operar</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </AdminExternaLayout>
  )
}
