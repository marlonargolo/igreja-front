/**
 * PerfisPage.tsx — Sem dados mockados
 * Roles e permissões carregadas do backend via GET /roles
 */
import { useEffect, useState } from 'react'
import { ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
import { http } from '@/lib/http'

interface RoleFromApi {
  id: number
  name: string
  description?: string
  active: boolean
  system: boolean
  permissionNames?: string[]
}

// Agrupamento de permissões por categoria para exibição
const PERM_CATEGORY: Record<string, string> = {
  MEMBER: 'Secretaria', FINANCE: 'Tesouraria', ACCOUNTING: 'Contabilidade',
  ASSET: 'Patrimônio', REPORT: 'Relatórios', USER: 'Usuários',
  SETTINGS: 'Configurações', BILLING: 'Assinatura', AUDIT: 'Auditoria',
  ROOT: 'Sistema', CHURCH: 'Igrejas', CONGREGATION: 'Congregações',
}

function categoryOf(permName: string): string {
  const prefix = permName.split('_')[0]
  return PERM_CATEGORY[prefix] || permName
}

export default function PerfisPage() {
  const showToast = useToast()
  const [roles, setRoles] = useState<RoleFromApi[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    // Usa /roles/available para qualquer usuário; ROOT usa /roles para ver tudo
    http.get<any>('/roles/available')
      .then(res => {
        const raw = res?.data
        setRoles(raw?.data || raw || [])
      })
      .catch(() => showToast('Falha ao carregar perfis.'))
      .finally(() => setLoading(false))
  }, [])

  function toggleExpand(id: number) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Agrupar permissões por categoria
  function groupPerms(permNames: string[] = []): Record<string, string[]> {
    const groups: Record<string, string[]> = {}
    permNames.forEach(name => {
      const cat = categoryOf(name)
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(name)
    })
    return groups
  }

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Perfis e Permissões' }]}
      title="Perfis e Permissões"
    >
      {loading ? (
        <div className="flex justify-center py-20 text-brand-300">Carregando...</div>
      ) : roles.length === 0 ? (
        <div className="flex justify-center py-20 text-brand-300">
          Nenhum perfil disponível para visualização.
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map(role => {
            const permsCount = role.permissionNames?.length || 0
            const isExp = expanded[role.id] ?? false
            const grouped = groupPerms(role.permissionNames)

            return (
              <Card key={role.id}>
                <CardBody className="pt-4 pb-4">
                  {/* Cabeçalho do card */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => toggleExpand(role.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-brand-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-brand-900">{role.name}</p>
                          {role.system && (
                            <Badge tone="gray">Sistema</Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-brand-400 mt-0.5">{role.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-brand-300">
                        {permsCount} permissão{permsCount !== 1 ? 'ões' : ''}
                      </span>
                      {isExp
                        ? <ChevronDown className="h-4 w-4 text-brand-300" />
                        : <ChevronRight className="h-4 w-4 text-brand-300" />}
                    </div>
                  </button>

                  {/* Permissões expandidas — agrupadas por módulo */}
                  {isExp && permsCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-brand-100 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(grouped).sort().map(([cat, perms]) => (
                        <div key={cat}>
                          <p className="text-xs font-bold text-brand-700 mb-1.5">{cat}</p>
                          <div className="space-y-1">
                            {perms.map(p => (
                              <div key={p} className="flex items-center gap-1.5 text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                                <span className="text-brand-500">{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExp && permsCount === 0 && (
                    <p className="mt-3 text-xs text-brand-300 pt-3 border-t border-brand-100">
                      Nenhuma permissão atribuída a este perfil.
                    </p>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="mt-6">
        <CardBody className="pt-5">
          <p className="text-sm font-bold text-brand-900 mb-2">Como funcionam os perfis</p>
          <p className="text-sm text-brand-500">
            Os perfis são atribuídos no cadastro de cada usuário em{' '}
            <strong>Configurações → Usuários</strong>. Além das permissões do perfil,
            é possível conceder permissões individuais extras clicando no ícone de escudo
            ao lado do usuário.
          </p>
        </CardBody>
      </Card>
    </Layout>
  )
}