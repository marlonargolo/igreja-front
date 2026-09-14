/**
 * AdminExterna.tsx — Painel ROOT de Administração do Sistema
 * Rota: /admin-externa/painel
 */
import { useState, useEffect } from 'react'
import { Building2, Users, MapPin, BarChart3, Eye, FileText, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/Misc'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'
import { http } from '@/lib/http'

interface ChurchRow {
  id: number; name: string; city?: string; state?: string
  status: string; plan_name?: string
  congregation_count: number; user_count: number; member_count: number
}

interface Stats { churches: number; congregations: number; users: number; members: number }

export default function AdminExterna() {
  const showToast = useToast()
  const navigate  = useNavigate()
  const [stats,    setStats]   = useState<Stats | null>(null)
  const [churches, setChurches]= useState<ChurchRow[]>([])
  const [loading,  setLoading] = useState(true)
  const [selected, setSelected]= useState<number | null>(null)
  const [subData,  setSubData] = useState<{ congregations: any[]; users: any[] } | null>(null)
  const [loadingSub, setLoadingSub] = useState(false)

  useEffect(() => {
    Promise.all([
      http.get<any>('/admin/stats'),
      http.get<any>('/admin/churches'),
    ]).then(([sRes, cRes]) => {
      setStats(sRes?.data)
      const raw = cRes?.data
      setChurches(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [])
    }).catch(() => showToast('Falha ao carregar.'))
    .finally(() => setLoading(false))
  }, [])

  async function expand(churchId: number) {
    if (selected === churchId) { setSelected(null); setSubData(null); return }
    setSelected(churchId)
    setLoadingSub(true)
    try {
      const [cRes, uRes] = await Promise.all([
        http.get<any>(`/admin/churches/${churchId}/congregations`),
        http.get<any>(`/admin/churches/${churchId}/users`),
      ])
      const cRaw = cRes?.data; const uRaw = uRes?.data
      setSubData({
        congregations: Array.isArray(cRaw?.data) ? cRaw.data : Array.isArray(cRaw) ? cRaw : [],
        users:         Array.isArray(uRaw?.data) ? uRaw.data : Array.isArray(uRaw) ? uRaw : [],
      })
    } catch { showToast('Falha ao expandir.') }
    finally { setLoadingSub(false) }
  }

  return (
    <Layout crumbs={[{ label: 'Adm. Externa' }, { label: 'Painel Geral' }]} title="Painel do Sistema">

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Igrejas"      value={String(stats.churches)}     icon={<Building2 className="h-4 w-4" />} />
          <MetricCard label="Congregações" value={String(stats.congregations)} icon={<MapPin className="h-4 w-4" />} />
          <MetricCard label="Usuários"     value={String(stats.users)}        icon={<Users className="h-4 w-4" />} />
          <MetricCard label="Membros"      value={String(stats.members)}      icon={<BarChart3 className="h-4 w-4" />} />
        </div>
      )}

      {/* Ações rápidas */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => navigate('/admin-externa/documentos')}>
          <FileText className="h-4 w-4" /> Gerenciar Documentos
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/igrejas')}>
          <Building2 className="h-4 w-4" /> Cadastrar Nova Igreja
        </Button>
      </div>

      {/* Lista de igrejas */}
      <Card>
        <CardHeader><CardTitle>Igrejas da Organização</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : churches.length === 0 ? (
            <div className="py-8 text-center text-brand-300">Nenhuma Igreja cadastrada.</div>
          ) : (
            <div className="space-y-2">
              {churches.map(c => (
                <div key={c.id} className="border border-brand-100 rounded-xl overflow-hidden">
                  <button onClick={() => expand(c.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-brand-50 transition-colors text-left">
                    <Building2 className="h-5 w-5 text-brand-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-900">{c.name}</p>
                      <p className="text-xs text-brand-300">
                        {[c.city, c.state].filter(Boolean).join(', ')}
                        {c.plan_name && ` · ${c.plan_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-brand-300 hidden sm:block">
                        {c.congregation_count} cong. · {c.member_count} membros · {c.user_count} usuários
                      </span>
                      <Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>
                        {c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <ChevronRight className={`h-4 w-4 text-brand-300 transition-transform ${selected === c.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Detalhes expandidos */}
                  {selected === c.id && (
                    <div className="border-t border-brand-100 bg-brand-50/50 px-4 py-4">
                      {loadingSub ? (
                        <p className="text-sm text-brand-300 text-center py-4">Carregando...</p>
                      ) : subData ? (
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-brand-400 uppercase mb-2">
                              Congregações ({subData.congregations.length})
                            </p>
                            {subData.congregations.length === 0 ? (
                              <p className="text-sm text-brand-300">Nenhuma congregação</p>
                            ) : (
                              <div className="space-y-1">
                                {subData.congregations.map((cg: any) => (
                                  <div key={cg.id} className="flex items-center justify-between py-1 border-b border-brand-100 last:border-0">
                                    <span className="text-sm text-brand-700">{cg.name}</span>
                                    <span className="text-xs text-brand-300">{cg.member_count} membros</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-brand-400 uppercase mb-2">
                              Usuários ({subData.users.length})
                            </p>
                            {subData.users.length === 0 ? (
                              <p className="text-sm text-brand-300">Nenhum usuário</p>
                            ) : (
                              <div className="space-y-1">
                                {subData.users.map((u: any) => (
                                  <div key={u.id} className="flex items-center justify-between py-1 border-b border-brand-100 last:border-0">
                                    <div>
                                      <p className="text-sm text-brand-700">{u.name}</p>
                                      <p className="text-xs text-brand-300">{u.email}</p>
                                    </div>
                                    <span className="text-xs text-brand-300">{u.roles || '—'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}