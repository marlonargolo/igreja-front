// src/pages/Subscription.tsx
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { billingService, type Plan, type Subscription, type Usage } from '@/services'
import { cn } from '@/lib/format'

export default function Subscription() {
  const { showToast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      billingService.listPlans(),
      billingService.getSubscription(),
      billingService.getUsage(),
    ])
      .then(([plansData, subData, usageData]) => {
        setPlans(plansData)
        setSubscription(subData)
        setUsage(usageData)
      })
      .catch(() => showToast('mensagem'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Configurações', to: '/configuracoes' }, { label: 'Assinatura' }]} title="Assinatura e Plano">
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </Layout>
    )
  }

  const currentPlan = subscription?.plan?.name || 'Plano Premium Multi'

  return (
    <Layout crumbs={[{ label: 'Configurações', to: '/configuracoes' }, { label: 'Assinatura' }]} title="Assinatura e Plano">
      <Card className="border-2 border-brand-800 mb-8">
        <CardBody className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-extrabold text-brand-900">{currentPlan}</h3>
                <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">Ativo</span>
              </div>
              <p className="text-sm text-brand-300 mt-1">Renovação automática em {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-extrabold text-brand-900">R$ {((subscription?.plan?.priceCents || 0) / 100).toFixed(2)}<span className="text-sm font-medium text-brand-300">/mês</span></span>
              <Button onClick={() => showToast('mensagem')}>Alterar Plano</Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-brand-100">
            <p className="text-sm font-bold text-brand-900 mb-4">Limite e Uso de Recursos</p>
            <div className="grid sm:grid-cols-3 gap-6">
              <UsageBar label="Membros Ativos" used={usage?.members.used || 0} total={usage?.members.total || 0} />
              <UsageBar label="Congregações" used={usage?.congregations.used || 0} total={usage?.congregations.total || 0} />
              <UsageBar label="Administradores" used={usage?.adminUsers.used || 0} total={usage?.adminUsers.total || 0} />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid sm:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = p.name === currentPlan
          return (
            <Card key={p.id} className={cn('p-6 flex flex-col', isCurrent && 'border-2 border-brand-800')}>
              <h3 className={cn('font-bold', isCurrent ? 'text-brand-800' : 'text-brand-900')}>{p.name}</h3>
              <p className="text-sm text-brand-300 mt-1 mb-4 min-h-[40px]">
                {p.name === 'Plano Básico' && 'Perfeito para igrejas locais pequenas.'}
                {p.name === 'Plano Profissional' && 'Recomendado para congregações em crescimento.'}
                {p.name === 'Plano Premium Multi' && 'Para campos ministeriais extensos e redes.'}
              </p>
              <div className="mb-5">
                <span className="text-3xl font-extrabold text-brand-900">R$ {(p.priceCents / 100).toFixed(2)}</span>
                <span className="text-sm text-brand-300"> /mês</span>
              </div>
              <p className="text-sm font-semibold text-brand-900 mb-3">O plano inclui:</p>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm text-brand-500"><Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Até {p.maxMembers} membros</li>
                <li className="flex items-start gap-2 text-sm text-brand-500"><Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Até {p.maxCongregations} congregações</li>
                <li className="flex items-start gap-2 text-sm text-brand-500"><Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Até {p.maxUsers} usuários admin</li>
                {p.features.map(f => (
                  <li key={f.key} className="flex items-start gap-2 text-sm text-brand-500">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> {f.label}
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? 'secondary' : 'outline'}
                disabled={isCurrent}
                className="w-full"
                onClick={() => {
                  billingService.changePlan(p.id)
                    .then(() => showToast('mensagem'))
                    .catch(() => sshowToast('mensagem'))
                }}
              >
                {isCurrent ? 'Plano Atual' : 'Selecionar Plano'}
              </Button>
            </Card>
          )
        })}
      </div>
    </Layout>
  )
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const percentage = total > 0 ? (used / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-semibold text-brand-900">{label}</span>
        <span className="text-brand-300">{used} / {total}</span>
      </div>
      <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
        <div className="h-full bg-brand-700 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  )
}