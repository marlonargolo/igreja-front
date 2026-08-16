// src/pages/CongregationDetail.tsx
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MapPin, Users, Wallet, Landmark } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { MetricCard } from '@/components/ui/Misc'
import { congregationsService } from '@/services'
import { formatCurrency } from '@/lib/format'
import { EmptyState } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'

export default function CongregationDetail() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [tab, setTab] = useState('Visão Geral')
  const [congregation, setCongregation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      congregationsService.get(Number(id))
        .then(data => setCongregation(data))
        .catch(() => showToast('mensagem'))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Congregações', to: '/congregacoes' }]} title="Carregando...">
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </Layout>
    )
  }

  if (!congregation) {
    return (
      <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Congregações', to: '/congregacoes' }]} title="Não encontrado">
        <EmptyState title="Congregação não encontrada" />
      </Layout>
    )
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Congregações', to: '/congregacoes' }, { label: congregation.name }]}
      title={congregation.name}
    >
      <div className="rounded-2xl overflow-hidden h-48 mb-6 relative">
        <img
          src={congregation.imageUrl || 'https://images.unsplash.com/photo-1542928123-74c1d7c4f00a'}
          alt={congregation.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/10 to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <h2 className="text-xl font-extrabold">{congregation.name}</h2>
          <p className="text-sm text-white/80 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {congregation.city}, {congregation.state}</p>
        </div>
        <Badge tone="navy" className="absolute top-4 right-4">{congregation.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Membros" value={congregation.members?.toString() || '0'} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Congregações" value="1" icon={<Landmark className="h-4 w-4" />} />
        <MetricCard label="Receitas do Mês" value={formatCurrency(congregation.revenue || 0)} icon={<Wallet className="h-4 w-4" />} />
        <MetricCard label="Despesas do Mês" value={formatCurrency(congregation.expenses || 0)} icon={<Wallet className="h-4 w-4" />} trendUp={false} />
      </div>

      <Tabs tabs={['Visão Geral', 'Cultos & Horários', 'Liderança']} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'Visão Geral' && (
        <Card><CardBody className="pt-6">
          <h3 className="font-bold text-brand-900 mb-2">Sobre a Congregação</h3>
          <p className="text-sm text-brand-500 leading-relaxed">
            {congregation.history || 'Informações sobre a congregação em breve.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-semibold">Endereço:</span> {congregation.address || '—'}</div>
            <div><span className="font-semibold">Pastor:</span> {congregation.pastorName || '—'}</div>
          </div>
        </CardBody></Card>
      )}

      {tab === 'Cultos & Horários' && (
        <Card><CardBody className="pt-6 text-center text-brand-300">Programação em breve.</CardBody></Card>
      )}

      {tab === 'Liderança' && (
        <Card><CardBody className="pt-6 text-center text-brand-300">Liderança em breve.</CardBody></Card>
      )}
    </Layout>
  )
}