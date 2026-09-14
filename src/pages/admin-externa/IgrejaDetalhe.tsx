// src/pages/admin-externa/IgrejaDetalhe.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Mail, Users, FileText, ScrollText } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { churchesService, resolveLogoUrl, type Church } from '@/services/churches.service'
import { adminService, type AuditLogEntry } from '@/services/admin.service'

export default function IgrejaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()

  const [church, setChurch] = useState<Church | null>(null)
  const [congregations, setCongregations] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [history, setHistory] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      churchesService.get(Number(id)).catch(() => null),
      adminService.churchCongregations(id).catch(() => []),
      adminService.churchUsers(id).catch(() => []),
      adminService.churchDocuments(id).catch(() => []),
      adminService.churchAudit(id).then(r => r.data).catch(() => []),
    ]).then(([c, congs, us, docs, hist]) => {
      setChurch(c); setCongregations(congs); setUsers(us); setDocuments(docs); setHistory(hist)
      if (!c) showToast('Falha ao carregar detalhes da igreja.')
    }).finally(() => setLoading(false))
  }, [id])

  return (
    <AdminExternaLayout
      crumbs={[{ label: 'Igrejas', to: '/admin-externa/igrejas' }, { label: church?.name || 'Detalhe' }]}
      title={church?.name || 'Detalhe da Igreja'}
      action={<Button variant="outline" onClick={() => navigate('/admin-externa/igrejas')}><ArrowLeft className="h-4 w-4" /> Voltar</Button>}
    >
      {loading ? (
        <div className="py-12 text-center text-brand-300">Carregando...</div>
      ) : !church ? (
        <EmptyState title="Igreja não encontrada" description="Verifique se o registro ainda existe." />
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start gap-6">
              {resolveLogoUrl(church.logoUrl) ? (
                <img src={resolveLogoUrl(church.logoUrl)} alt={church.name} className="h-24 w-24 rounded-2xl object-cover border border-brand-100" />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center text-3xl font-extrabold text-white/40">
                  {church.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-extrabold text-brand-900">{church.name}</h2>
                  <Badge tone={church.status === 'ACTIVE' ? 'green' : 'gray'}>{church.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-400">
                  {(church.city || church.state) && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[church.city, church.state].filter(Boolean).join(', ')}</span>}
                  {church.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {church.phone}</span>}
                  {church.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {church.email}</span>}
                </div>
                <p className="text-xs text-brand-300 mt-2">CNPJ: {church.cnpj || '—'}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <Metric label="Congregações" value={congregations.length} />
                <Metric label="Usuários" value={users.length} />
                <Metric label="Documentos" value={documents.length} />
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Usuários ({users.length})</CardTitle></CardHeader>
              <CardBody className="pt-2">
                {users.length === 0 ? <p className="text-sm text-brand-300 py-4">Nenhum usuário.</p> : (
                  <div className="space-y-1">
                    {users.slice(0, 8).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-brand-100 last:border-0">
                        <div><p className="text-sm text-brand-800 font-medium">{u.name}</p><p className="text-xs text-brand-300">{u.email}</p></div>
                        <span className="text-xs text-brand-300">{u.roles || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate(`/admin-externa/usuarios?churchId=${church.id}`)}>Ver todos</Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Últimos Documentos ({documents.length})</CardTitle></CardHeader>
              <CardBody className="pt-2">
                {documents.length === 0 ? <p className="text-sm text-brand-300 py-4">Nenhum documento enviado.</p> : (
                  <div className="space-y-1">
                    {documents.slice(0, 8).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between py-2 border-b border-brand-100 last:border-0">
                        <p className="text-sm text-brand-800 font-medium truncate">{d.title}</p>
                        <span className="text-xs text-brand-300">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate(`/admin-externa/documentos?churchId=${church.id}`)}>Ver todos</Button>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Histórico de Alterações</CardTitle></CardHeader>
            <CardBody className="pt-2">
              {history.length === 0 ? <p className="text-sm text-brand-300 py-4">Nenhum registro de auditoria encontrado.</p> : (
                <div className="space-y-1">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b border-brand-100 last:border-0 text-sm">
                      <span className="text-brand-800">{h.description || h.action}</span>
                      <span className="text-xs text-brand-300">{new Date(h.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </AdminExternaLayout>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3">
      <p className="text-2xl font-extrabold text-brand-900">{value}</p>
      <p className="text-xs text-brand-300">{label}</p>
    </div>
  )
}
