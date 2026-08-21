import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { cn } from '@/lib/format'

interface Plan {
  id: string
  name: string
  price: number
  maxMembers: number
  maxCongregations: number
  maxUsers: number
  features: string[]
}

const PLANOS_DEFAULT: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 79,
    maxMembers: 100,
    maxCongregations: 1,
    maxUsers: 3,
    features: ['Dashboard', 'Membros', 'Secretaria', 'Relatórios básicos'],
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 149,
    maxMembers: 500,
    maxCongregations: 5,
    maxUsers: 10,
    features: ['Tudo do Básico', 'Tesouraria completa', 'Patrimônio', 'Relatórios avançados'],
  },
  {
    id: 'premium',
    name: 'Premium Multi',
    price: 299,
    maxMembers: 9999,
    maxCongregations: 999,
    maxUsers: 999,
    features: ['Tudo do Profissional', 'Contabilidade', 'Multi-congregações ilimitadas', 'Suporte prioritário', 'Exportação contábil'],
  },
]

export default function Subscription() {
  const showToast = useToast()
  const [plans, setPlans] = useState<Plan[]>(PLANOS_DEFAULT)
  const [currentPlan] = useState('premium')
  const [openNew, setOpenNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    maxMembers: '100',
    maxCongregations: '1',
    maxUsers: '5',
    features: '',
  })

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()
    if (!newPlan.name || !newPlan.price) { showToast('Nome e preço são obrigatórios.'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    const plan: Plan = {
      id: Date.now().toString(),
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      maxMembers: parseInt(newPlan.maxMembers),
      maxCongregations: parseInt(newPlan.maxCongregations),
      maxUsers: parseInt(newPlan.maxUsers),
      features: newPlan.features.split('\n').filter(f => f.trim()),
    }
    setPlans(prev => [...prev, plan])
    showToast(`Plano "${plan.name}" criado com sucesso.`)
    setOpenNew(false)
    setNewPlan({ name: '', price: '', maxMembers: '100', maxCongregations: '1', maxUsers: '5', features: '' })
    setSaving(false)
  }

  return (
    <Layout
      crumbs={[{ label: 'Administração' }, { label: 'Assinatura' }]}
      title="Assinatura e Planos"
      action={{ label: 'Novo Plano', icon: <Plus className="h-4 w-4" />, onClick: () => setOpenNew(true) }}
    >
      {/* Plano atual */}
      <Card className="border-2 border-brand-800 mb-8">
        <CardBody className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-extrabold text-brand-900">
                  {plans.find(p => p.id === currentPlan)?.name || 'Premium Multi'}
                </h3>
                <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">Ativo</span>
              </div>
              <p className="text-sm text-brand-300 mt-1">Renovação automática mensal</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-extrabold text-brand-900">
                R$ {plans.find(p => p.id === currentPlan)?.price.toFixed(2)}
                <span className="text-sm font-medium text-brand-300">/mês</span>
              </span>
              <Button onClick={() => showToast('Entre em contato com o suporte para alterar o plano.')}>
                Alterar Plano
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de planos */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlan
          return (
            <Card key={plan.id} className={cn('relative', isCurrent && 'border-2 border-brand-800')}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Plano Atual
                </div>
              )}
              <CardBody className="pt-6">
                <h3 className="font-extrabold text-brand-900 text-lg">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-brand-900 mt-2">
                  R$ {plan.price.toFixed(2)}
                  <span className="text-sm font-medium text-brand-300">/mês</span>
                </p>
                <div className="mt-4 space-y-1.5 text-sm text-brand-500">
                  <p>✓ Até {plan.maxMembers === 9999 ? 'ilimitados' : plan.maxMembers} membros</p>
                  <p>✓ Até {plan.maxCongregations === 999 ? 'ilimitadas' : plan.maxCongregations} congregações</p>
                  <p>✓ Até {plan.maxUsers === 999 ? 'ilimitados' : plan.maxUsers} usuários</p>
                </div>
                <div className="mt-4 space-y-1.5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-brand-700">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-6"
                  variant={isCurrent ? 'outline' : 'primary'}
                  disabled={isCurrent}
                  onClick={() => !isCurrent && showToast(`Para migrar para ${plan.name}, contate o suporte.`)}
                >
                  {isCurrent ? 'Plano Atual' : `Migrar para ${plan.name}`}
                </Button>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Modal criar plano */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Novo Plano de Assinatura"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlan} disabled={saving}>
              {saving ? 'Criando...' : 'Criar Plano'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <Input label="Nome do Plano" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="Ex: Empresarial" required />
          <Input label="Preço mensal (R$)" type="number" step="0.01" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} required />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Máx. Membros" type="number" value={newPlan.maxMembers} onChange={e => setNewPlan({ ...newPlan, maxMembers: e.target.value })} />
            <Input label="Máx. Congregações" type="number" value={newPlan.maxCongregations} onChange={e => setNewPlan({ ...newPlan, maxCongregations: e.target.value })} />
            <Input label="Máx. Usuários" type="number" value={newPlan.maxUsers} onChange={e => setNewPlan({ ...newPlan, maxUsers: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Funcionalidades (uma por linha)</p>
            <textarea
              rows={5}
              value={newPlan.features}
              onChange={e => setNewPlan({ ...newPlan, features: e.target.value })}
              placeholder="Dashboard&#10;Membros&#10;Tesouraria&#10;..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </Layout>
  )
}