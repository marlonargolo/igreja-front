// src/pages/admin-externa/Modulos.tsx
//
// Visualização dos módulos disponíveis no sistema e, quando uma Igreja está
// selecionada no seletor global, habilitação/desabilitação por Igreja
// (integrada ao plano contratado).
import { useEffect, useState } from 'react'
import { Blocks, AlertCircle } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { adminService, type SystemModule } from '@/services/admin.service'

export default function Modulos() {
  const showToast = useToast()
  const { mode, scopeChurchId, scopeChurch } = useAdminExterna()
  const [modules, setModules] = useState<SystemModule[]>([])
  const [churchModules, setChurchModules] = useState<SystemModule[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => { load() }, [scopeChurchId])

  async function load() {
    setLoading(true)
    setUnavailable(false)
    try {
      const list = await adminService.modules()
      setModules(list)
      if (list.length === 0) setUnavailable(true)
    } catch { setUnavailable(true) }

    if (scopeChurchId) {
      try { setChurchModules(await adminService.churchModules(scopeChurchId)) }
      catch { setChurchModules([]) }
    } else {
      setChurchModules([])
    }
    setLoading(false)
  }

  async function toggle(mod: SystemModule, enabled: boolean) {
    if (!scopeChurchId) return
    try {
      await adminService.setChurchModule(scopeChurchId, mod.id, enabled)
      setChurchModules(prev => prev.map(m => m.id === mod.id ? { ...m, enabled } : m))
      showToast(`Módulo "${mod.name}" ${enabled ? 'habilitado' : 'desabilitado'} para ${scopeChurch?.name}.`)
    } catch { showToast('Falha ao alterar o módulo.') }
  }

  const isEnabled = (mod: SystemModule) => churchModules.find(m => m.id === mod.id)?.enabled ?? mod.enabled ?? true

  return (
    <AdminExternaLayout crumbs={[{ label: 'Módulos' }]} title="Módulos">
      {mode === 'global' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Selecione uma Igreja no seletor do topo para habilitar ou desabilitar módulos específicos para ela.
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
                {scopeChurchId ? (
                  <Switch checked={isEnabled(mod)} onChange={v => toggle(mod, v)} label={isEnabled(mod) ? 'Habilitado' : 'Desabilitado'} />
                ) : (
                  <p className="text-xs text-brand-300">Selecione uma igreja para gerenciar</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </AdminExternaLayout>
  )
}
