// src/pages/admin-externa/PainelGeral.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Users, BarChart3, FileText, Headphones, Wallet, AlertCircle } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Misc'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { adminService, type AdminStats } from '@/services/admin.service'
import { supportService } from '@/services/support.service'

export default function PainelGeral() {
  const navigate = useNavigate()
  const { mode, scopeChurch, scopeChurchId } = useAdminExterna()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [openTickets, setOpenTickets] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(false)
    Promise.all([
      adminService.stats(),
      supportService.list().catch(() => []),
    ]).then(([s, tickets]) => {
      if (!alive) return
      setStats(s)
      if (!s) setError(true)
      setOpenTickets(tickets.filter(t => t.status === 'ABERTO').length)
    }).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [scopeChurchId])

  const cards = stats ? [
    { label: 'Igrejas', value: stats.churches, icon: Building2, to: '/admin-externa/igrejas', hideWhenFiltered: true },
    { label: 'Congregações', value: stats.congregations, icon: MapPin, to: '/admin-externa/congregacoes' },
    { label: 'Usuários', value: stats.users, icon: Users, to: '/admin-externa/usuarios' },
    { label: 'Membros Ativos', value: stats.members, icon: BarChart3, to: '/admin-externa/congregacoes' },
    ...(stats.transactions !== undefined ? [{ label: 'Transações no Período', value: stats.transactions, icon: Wallet, to: '/admin-externa/painel' }] : []),
    ...(stats.balance !== undefined ? [{ label: 'Saldo Consolidado', value: stats.balance, icon: Wallet, to: '/admin-externa/painel', currency: true }] : []),
    { label: 'Documentos Enviados', value: stats.documents ?? 0, icon: FileText, to: '/admin-externa/documentos' },
    { label: 'Chamados Abertos', value: openTickets ?? 0, icon: Headphones, to: '/admin-externa/painel' },
  ].filter(c => !(c.hideWhenFiltered && mode === 'filtered')) : []

  return (
    <AdminExternaLayout crumbs={[{ label: 'Painel Geral' }]} title="Painel Geral">
      {mode === 'filtered' && scopeChurch && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Exibindo indicadores filtrados para <strong>{scopeChurch.name}</strong>. Use o seletor no topo para voltar ao modo global.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-5 h-[104px] animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center gap-2 text-brand-400">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="font-semibold text-brand-900">Não foi possível carregar os indicadores.</p>
            <p className="text-sm">Verifique a conexão com o backend e tente novamente.</p>
          </div>
        </Card>
      ) : cards.length === 0 ? (
        <EmptyState title="Sem indicadores disponíveis" description="Nenhum dado retornado pelo backend para este escopo." />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <button key={c.label} onClick={() => navigate(c.to)} className="text-left">
              <Card className="p-5 flex flex-col gap-3 hover:shadow-soft hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between">
                  <span className="text-sm text-brand-300 font-medium">{c.label}</span>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">
                    <c.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-brand-900 leading-tight">
                  {c.currency
                    ? Number(c.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : Number(c.value).toLocaleString('pt-BR')}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </AdminExternaLayout>
  )
}
