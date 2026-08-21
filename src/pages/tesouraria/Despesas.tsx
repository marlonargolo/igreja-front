import { useEffect, useState, useMemo } from 'react'
import { Plus, TrendingDown, Edit2, Trash2, Paperclip } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { MetricCard } from '@/components/ui/Misc'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/components/ui/Extras'
import { financeService, type Transaction } from '@/services'

const CATEGORIAS_DESPESA = ['Conta de Água', 'Conta de Luz', 'Material de Limpeza', 'Aluguel', 'Manutenção', 'Equipamentos', 'Transferência', 'Repasse (Redízimo)', 'Outros']

export default function Despesas() {
  const showToast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    dateLancamento: new Date().toISOString().split('T')[0],
    dateVencimento: '',
    datePagamento: '',
    category: 'Conta de Luz',
    isProvisao: false,
    parcelas: '1',
    fornecedor: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await financeService.list({ size: 100, type: 'EXPENSE' }) as any
      setTransactions(res?.content || res?.data || res || [])
    } catch {
      showToast('Falha ao carregar despesas.')
    } finally {
      setLoading(false)
    }
  }

  const total = useMemo(() => transactions.reduce((s, t) => s + Number(t.amount), 0), [transactions])

  function resetForm() {
    setForm({
      description: '', amount: '', dateLancamento: new Date().toISOString().split('T')[0],
      dateVencimento: '', datePagamento: '', category: 'Conta de Luz',
      isProvisao: false, parcelas: '1', fornecedor: '',
    })
    setComprovante(null)
    setEditingId(null)
  }

  function openNew() {
    resetForm()
    setOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setForm({
      description: t.description,
      amount: String(t.amount),
      dateLancamento: t.transactionDate,
      dateVencimento: '',
      datePagamento: '',
      category: t.categoryName || 'Conta de Luz',
      isProvisao: false,
      parcelas: '1',
      fornecedor: '',
    })
    setComprovante(null)
    setOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta despesa?')) return
    try {
      await financeService.delete(id)
      showToast('Despesa excluída.')
      load()
    } catch {
      showToast('Falha ao excluir.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const desc = form.fornecedor
        ? `${form.fornecedor} — ${form.description}`
        : form.description

      if (editingId) {
        await financeService.update(editingId, {
          description: desc,
          amount: parseFloat(form.amount),
          transactionDate: form.dateLancamento,
        } as any)
        showToast('Despesa atualizada.')
      } else {
        await financeService.create({
          churchId: 2,
          type: 'EXPENSE',
          description: desc,
          amount: parseFloat(form.amount),
          transactionDate: form.dateLancamento,
          categoryId: 1,
          accountId: 1,
        } as any)
        showToast('Despesa registrada com sucesso.')
      }
      setOpen(false)
      resetForm()
      load()
    } catch {
      showToast('Falha ao registrar despesa.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Despesas' }]}
      title="Despesas"
      action={{ label: 'Nova Despesa', icon: <Plus className="h-4 w-4" />, onClick: openNew }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total de Despesas" value={formatCurrency(total)} icon={<TrendingDown className="h-4 w-4" />} trendUp={false} />
        <MetricCard label="Lançamentos" value={String(transactions.length)} icon={<TrendingDown className="h-4 w-4" />} trendUp={false} />
      </div>

      <Card>
        <CardHeader><CardTitle>Lançamentos de Despesas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-brand-300">Nenhuma despesa lançada.</div>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Data</Th><Th>Descrição</Th><Th>Categoria</Th><Th>Valor</Th><Th>Status</Th><Th>Ações</Th>
                </tr>
              </Thead>
              <tbody>
                {transactions.map(t => (
                  <Tr key={t.id}>
                    <Td>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</Td>
                    <Td className="font-semibold">{t.description}</Td>
                    <Td><Badge tone="red">{t.categoryName || '—'}</Badge></Td>
                    <Td className="text-red-500 font-semibold">{formatCurrency(t.amount)}</Td>
                    <Td><Badge tone={t.status === 'CONFIRMED' ? 'green' : 'yellow'}>{t.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm() }}
        title={editingId ? 'Editar Despesa' : 'Nova Despesa'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar Despesa'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          <Input
            label="Descrição"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Data do Lançamento" type="date" value={form.dateLancamento} onChange={e => setForm({ ...form, dateLancamento: e.target.value })} />
          </div>

          {/* Provisão toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="provisao"
              checked={form.isProvisao}
              onChange={e => setForm({ ...form, isProvisao: e.target.checked })}
              className="h-4 w-4 rounded border-brand-200"
            />
            <label htmlFor="provisao" className="text-sm font-medium text-brand-700">
              Provisão (parcelamento / pagamento futuro)
            </label>
          </div>

          {/* Campos que aparecem APENAS quando Provisão está marcado */}
          {form.isProvisao && (
            <div className="space-y-4 border-l-2 border-brand-100 pl-4">
              <Input
                label="Fornecedor"
                value={form.fornecedor}
                onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                placeholder="Ex: Sanepar, Copel, Locadora..."
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data de Vencimento" type="date" value={form.dateVencimento} onChange={e => setForm({ ...form, dateVencimento: e.target.value })} />
                <Input label="Data de Pagamento" type="date" value={form.datePagamento} onChange={e => setForm({ ...form, datePagamento: e.target.value })} />
              </div>
              <Input
                label="Número de Parcelas"
                type="number"
                min="1"
                max="120"
                value={form.parcelas}
                onChange={e => setForm({ ...form, parcelas: e.target.value })}
              />
              <div>
                <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" /> Comprovante
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setComprovante(e.target.files?.[0] || null)}
                  className="text-sm text-brand-500"
                />
                {comprovante && (
                  <p className="text-xs text-brand-300 mt-1">{comprovante.name}</p>
                )}
              </div>
            </div>
          )}
        </form>
      </Modal>
    </Layout>
  )
}