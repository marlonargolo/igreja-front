import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Check, X, Loader2,
  Users, Building2, UserCheck, Sparkles, AlertTriangle,
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Switch } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { http } from '@/lib/http'
import { cn } from '@/lib/format'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Plan {
  id: number
  name: string
  description?: string
  price: number
  maxMembers: number
  maxCongregations: number
  maxUsers: number
  features?: string   // JSON array string ex: '["Membros","Tesouraria"]'
  active: boolean
  system: boolean
}

type FormState = {
  name: string
  description: string
  price: string
  maxMembers: string
  maxCongregations: string
  maxUsers: string
  features: string    // uma feature por linha
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  maxMembers: '100',
  maxCongregations: '1',
  maxUsers: '5',
  features: '',
  active: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFeatures(raw?: string): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [raw] }
}

function featuresToString(raw?: string): string {
  return parseFeatures(raw).join('\n')
}

function planToForm(p: Plan): FormState {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    maxMembers: String(p.maxMembers),
    maxCongregations: String(p.maxCongregations),
    maxUsers: String(p.maxUsers),
    features: featuresToString(p.features),
    active: p.active,
  }
}

function formToPayload(f: FormState) {
  const featuresArray = f.features.split('\n').map(s => s.trim()).filter(Boolean)
  return {
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    price: parseFloat(f.price) || 0,
    maxMembers: parseInt(f.maxMembers) || 100,
    maxCongregations: parseInt(f.maxCongregations) || 1,
    maxUsers: parseInt(f.maxUsers) || 5,
    features: JSON.stringify(featuresArray),
    active: f.active,
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Subscription() {
  const showToast = useToast()
  const { user: currentUser, church: currentChurch } = useApp()
  const isRoot = currentUser?.roles?.includes('ROOT') ?? false

  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  // Modal confirmar exclusão
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  // Modal trocar plano da Igreja
  const [changeOpen, setChangeOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  // ─── Carga ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadData() }, [currentChurch?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [plansRes, churchRes] = await Promise.all([
        http.get<any>('/plans'),
        currentChurch?.id
          ? http.get<any>(`/churches/${currentChurch.id}`)
          : Promise.resolve(null),
      ])

      const raw = plansRes.data?.data ?? plansRes.data ?? []
      setPlans(Array.isArray(raw) ? raw : [])

      if (churchRes) {
        const church = churchRes.data?.data ?? churchRes.data
        setCurrentPlanId(church?.plan?.id ?? null)
      }
    } catch (err: any) {
      showToast(err?.response?.status === 403
        ? 'Acesso aos planos disponível apenas para o ROOT.'
        : 'Falha ao carregar planos.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Abrir modal ────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditing(plan)
    setForm(planToForm(plan))
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  // ─── Salvar (criar ou editar) ────────────────────────────────────────────────

  async function handleSave() {
    setFormError('')
    if (!form.name.trim()) { setFormError('Nome do plano é obrigatório.'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { setFormError('Preço inválido.'); return }
    if (parseInt(form.maxUsers) < 1) { setFormError('Mínimo 1 usuário.'); return }
    if (parseInt(form.maxCongregations) < 1) { setFormError('Mínimo 1 congregação.'); return }
    if (parseInt(form.maxMembers) < 1) { setFormError('Mínimo 1 membro.'); return }

    setSaving(true)
    try {
      const payload = formToPayload(form)
      if (editing) {
        await http.put(`/plans/${editing.id}`, payload)
        showToast(`Plano "${payload.name}" atualizado.`)
      } else {
        await http.post('/plans', payload)
        showToast(`Plano "${payload.name}" criado.`)
      }
      closeModal()
      loadData()
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Falha ao salvar plano.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Excluir ────────────────────────────────────────────────────────────────

  async function handleDelete(plan: Plan) {
    setDeleting(plan.id)
    try {
      await http.delete(`/plans/${plan.id}`)
      showToast(`Plano "${plan.name}" desativado.`)
      setDeleteTarget(null)
      loadData()
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Falha ao desativar plano.')
    } finally {
      setDeleting(null)
    }
  }

  // ─── Trocar plano da Igreja ──────────────────────────────────────────────────

  async function handleChangePlan() {
    if (!selectedPlanId || !currentChurch?.id) return
    setSaving(true)
    try {
      await http.put(`/churches/${currentChurch.id}`, { planId: selectedPlanId })
      setCurrentPlanId(selectedPlanId)
      showToast('Plano da Igreja atualizado.')
      setChangeOpen(false)
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Falha ao alterar plano.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Administração' }, { label: 'Planos' }]} title="Planos de Assinatura">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
        </div>
      </Layout>
    )
  }

  const currentPlan = plans.find(p => p.id === currentPlanId)
  const activePlans = plans.filter(p => p.active)
  const inactivePlans = plans.filter(p => !p.active)

  return (
    <Layout
      crumbs={[{ label: 'Administração' }, { label: 'Planos' }]}
      title="Planos de Assinatura"
      action={isRoot ? {
        label: 'Novo Plano',
        icon: <Plus className="h-4 w-4" />,
        onClick: openCreate,
      } : undefined}
    >

      {/* ── Plano atual da Igreja ── */}
      {currentPlan && (
        <Card className="border-2 border-brand-800 mb-8">
          <CardBody className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-extrabold text-brand-900">{currentPlan.name}</h3>
                  <Badge tone="green">Ativo</Badge>
                  {currentPlan.system && <Badge tone="purple">Sistema</Badge>}
                </div>
                {currentPlan.description && (
                  <p className="text-sm text-brand-400 mt-0.5">{currentPlan.description}</p>
                )}
                <p className="text-sm text-brand-300 mt-1">{currentChurch?.name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-brand-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {currentPlan.maxUsers >= 999 ? 'Ilimitados' : currentPlan.maxUsers} usuários
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {currentPlan.maxCongregations >= 999 ? 'Ilimitadas' : currentPlan.maxCongregations} congregações
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    {currentPlan.maxMembers >= 9999 ? 'Ilimitados' : currentPlan.maxMembers} membros
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-brand-900">
                    R$ {Number(currentPlan.price).toFixed(2)}
                    <span className="text-sm font-medium text-brand-300">/mês</span>
                  </p>
                </div>
                {isRoot && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(currentPlan)}>
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button size="sm" onClick={() => { setSelectedPlanId(currentPlanId); setChangeOpen(true) }}>
                      Trocar Plano
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Tabela de todos os planos ── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Todos os Planos ({plans.length})</CardTitle>
        </CardHeader>
        <CardBody className="pt-2">
          <Table>
            <Thead>
              <tr>
                <Th>Nome</Th>
                <Th>Descrição</Th>
                <Th>Preço/mês</Th>
                <Th>Usuários</Th>
                <Th>Congregações</Th>
                <Th>Membros</Th>
                <Th>Funcionalidades</Th>
                <Th>Status</Th>
                {isRoot && <Th>Ações</Th>}
              </tr>
            </Thead>
            <tbody>
              {plans.map(plan => {
                const isCurrent = plan.id === currentPlanId
                const features = parseFeatures(plan.features)
                return (
                  <Tr key={plan.id} className={isCurrent ? 'bg-brand-50/80' : ''}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-900">{plan.name}</span>
                        {isCurrent && <Badge tone="navy">Igreja Atual</Badge>}
                        {plan.system && <Badge tone="purple">Sistema</Badge>}
                      </div>
                    </Td>
                    <Td className="text-brand-400 text-xs max-w-[160px]">
                      {plan.description || '—'}
                    </Td>
                    <Td className="font-semibold">
                      R$ {Number(plan.price).toFixed(2)}
                    </Td>
                    <Td>
                      {plan.maxUsers >= 999
                        ? <Badge tone="green">Ilimitados</Badge>
                        : plan.maxUsers}
                    </Td>
                    <Td>
                      {plan.maxCongregations >= 999
                        ? <Badge tone="green">Ilimitadas</Badge>
                        : plan.maxCongregations}
                    </Td>
                    <Td>
                      {plan.maxMembers >= 9999
                        ? <Badge tone="green">Ilimitados</Badge>
                        : plan.maxMembers}
                    </Td>
                    <Td className="max-w-[200px]">
                      {features.length === 0 ? (
                        <span className="text-brand-300 text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {features.slice(0, 3).map(f => (
                            <span key={f} className="text-[11px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                          {features.length > 3 && (
                            <span className="text-[11px] text-brand-300">+{features.length - 3}</span>
                          )}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={plan.active ? 'green' : 'gray'}>
                        {plan.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Td>
                    {isRoot && (
                      <Td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(plan)}
                            className="p-1.5 rounded hover:bg-brand-50 text-brand-400 hover:text-brand-800"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!plan.system && plan.id !== currentPlanId && (
                            <button
                              onClick={() => setDeleteTarget(plan)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-400"
                              title="Desativar"
                              disabled={deleting === plan.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </Td>
                    )}
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* ── Cards visuais dos planos ativos ── */}
      <div className="grid md:grid-cols-3 gap-6">
        {activePlans.map(plan => {
          const isCurrent = plan.id === currentPlanId
          const features = parseFeatures(plan.features)
          return (
            <Card key={plan.id} className={cn('relative flex flex-col', isCurrent && 'border-2 border-brand-800')}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-800 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Plano Atual
                </div>
              )}
              <CardBody className="pt-6 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-brand-900 text-lg">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-brand-400 mt-0.5">{plan.description}</p>
                    )}
                  </div>
                  {plan.system && <Badge tone="purple">Sistema</Badge>}
                </div>

                <p className="text-3xl font-extrabold text-brand-900 mt-4">
                  R$ {Number(plan.price).toFixed(2)}
                  <span className="text-sm font-medium text-brand-300">/mês</span>
                </p>

                <div className="mt-4 space-y-2 text-sm text-brand-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-brand-300 shrink-0" />
                    <span>
                      {plan.maxUsers >= 999 ? 'Usuários ilimitados' : `Até ${plan.maxUsers} usuários`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-brand-300 shrink-0" />
                    <span>
                      {plan.maxCongregations >= 999 ? 'Congregações ilimitadas' : `Até ${plan.maxCongregations} congregações`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-brand-300 shrink-0" />
                    <span>
                      {plan.maxMembers >= 9999 ? 'Membros ilimitados' : `Até ${plan.maxMembers} membros`}
                    </span>
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brand-100 space-y-1.5 flex-1">
                    {features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-brand-700">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}

                {isRoot && (
                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(plan)}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => { setSelectedPlanId(plan.id); setChangeOpen(true) }}
                      >
                        Aplicar
                      </Button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* ── Modal CRUD (criar / editar) ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Editar Plano — ${editing.name}` : 'Novo Plano'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : editing ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {formError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Identificação */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome do Plano *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Empresarial"
            />
            <Input
              label="Preço mensal (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Input
            label="Descrição"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Breve descrição do plano"
          />

          {/* Quotas */}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-3">Quotas do Plano</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Input
                  label="Máx. Usuários *"
                  type="number"
                  min="1"
                  value={form.maxUsers}
                  onChange={e => setForm({ ...form, maxUsers: e.target.value })}
                  hint="999 = ilimitado"
                />
              </div>
              <div>
                <Input
                  label="Máx. Congregações *"
                  type="number"
                  min="1"
                  value={form.maxCongregations}
                  onChange={e => setForm({ ...form, maxCongregations: e.target.value })}
                  hint="999 = ilimitado"
                />
              </div>
              <div>
                <Input
                  label="Máx. Membros *"
                  type="number"
                  min="1"
                  value={form.maxMembers}
                  onChange={e => setForm({ ...form, maxMembers: e.target.value })}
                  hint="9999 = ilimitado"
                />
              </div>
            </div>
          </div>

          {/* Funcionalidades */}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              Funcionalidades incluídas
            </p>
            <p className="text-xs text-brand-400 mb-2">Uma funcionalidade por linha. Aparecem como itens com ✓ no cartão do plano.</p>
            <Textarea
              rows={6}
              value={form.features}
              onChange={e => setForm({ ...form, features: e.target.value })}
              placeholder={
                'Dashboard\nMembros e Secretaria\nTesouraria completa\nPatrimônio\nContabilidade\nRelatórios avançados\nSuporte prioritário'
              }
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-3 px-4 bg-brand-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-brand-900">Plano ativo</p>
              <p className="text-xs text-brand-400">Planos inativos não aparecem para seleção</p>
            </div>
            <Switch
              checked={form.active}
              onChange={v => setForm({ ...form, active: v })}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal confirmar exclusão ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Desativar Plano"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleting === deleteTarget?.id}
            >
              {deleting === deleteTarget?.id
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Desativando...</>
                : 'Desativar'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-brand-700">
              Deseja desativar o plano <strong>{deleteTarget?.name}</strong>?
            </p>
            <p className="text-xs text-brand-400 mt-1">
              Igrejas vinculadas a este plano não serão afetadas. O plano ficará oculto para novas seleções.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal trocar plano da Igreja ── */}
      <Modal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title={`Trocar plano — ${currentChurch?.name}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setChangeOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleChangePlan}
              disabled={saving || !selectedPlanId || selectedPlanId === currentPlanId}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-brand-400 mb-4">
            Selecione o novo plano para esta Igreja. Quotas serão aplicadas imediatamente.
          </p>
          {activePlans.map(plan => (
            <label
              key={plan.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                selectedPlanId === plan.id
                  ? 'border-brand-800 bg-brand-50'
                  : 'border-brand-100 hover:border-brand-300',
              )}
            >
              <input
                type="radio"
                name="change-plan"
                checked={selectedPlanId === plan.id}
                onChange={() => setSelectedPlanId(plan.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-900">{plan.name}</p>
                  <p className="font-bold text-brand-900 text-sm">
                    R$ {Number(plan.price).toFixed(2)}<span className="text-brand-300 font-normal">/mês</span>
                  </p>
                </div>
                <p className="text-xs text-brand-400 mt-0.5">
                  {plan.maxUsers >= 999 ? '∞' : plan.maxUsers} usuários ·{' '}
                  {plan.maxCongregations >= 999 ? '∞' : plan.maxCongregations} congregações ·{' '}
                  {plan.maxMembers >= 9999 ? '∞' : plan.maxMembers} membros
                </p>
              </div>
            </label>
          ))}
        </div>
      </Modal>

    </Layout>
  )
}