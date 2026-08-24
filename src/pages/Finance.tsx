import { useMemo, useState, useEffect } from 'react'
import { Plus, ArrowLeftRight, Edit2, Trash2, Paperclip } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/components/ui/Extras'
import { financeService, type Transaction } from '@/services'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'
import { useConfig } from '@/lib/ConfigContext'

const CATEGORIAS_TRANSFERENCIA = [
  'Transferência entre Contas',
  'Repasse à Sede (Redízimo)',
  'Transferência entre Congregações',
]

interface FinancialAccount {
  id: number
  name: string
  type: string
  bankName?: string
  currentBalance?: number
}

export default function Finance() {
  const showToast = useToast()
  const { config } = useConfig()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIAS_TRANSFERENCIA[0],
    contaOrigemId: '',
    contaDestinoId: '',
  })
  

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const txRes = await financeService.list({ size: 100, type: 'EXPENSE' }) as any
      const raw = txRes as any
      const all = raw?.content || raw?.data || raw || []
      setTransactions(all.filter((t: Transaction) => isTransfer(t)))
    } catch {
      showToast('Falha ao carregar transferências.')
    } finally {
      setLoading(false)
    }
  }

  function isTransfer(t: Transaction) {
    const cat = (t.categoryName || t.description || '').toLowerCase()
    return cat.includes('transfer') || cat.includes('repasse') || cat.includes('redízimo')
  }

  const total = useMemo(() => transactions.reduce((s, t) => s + Number(t.amount), 0), [transactions])

  function resetForm() {
    setForm({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: CATEGORIAS_TRANSFERENCIA[0],
      contaOrigemId: '',
      contaDestinoId: '',
    })
    setComprovante(null)
    setEditingId(null)
  }

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setForm({
      description: t.description,
      amount: String(t.amount),
      date: t.transactionDate,
      category: t.categoryName || CATEGORIAS_TRANSFERENCIA[0],
      contaOrigemId: String((t as any).accountId || ''),
      contaDestinoId: '',
    })
    setComprovante(null)
    setOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta transferência?')) return
    try {
      await financeService.delete(id)
      showToast('Transferência excluída.')
      loadAll()
    } catch {
      showToast('Falha ao excluir.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount) { showToast('Informe o valor.'); return }

    const origemNome = accounts.find(a => String(a.id) === form.contaOrigemId)?.name || form.contaOrigemId
    const destinoNome = accounts.find(a => String(a.id) === form.contaDestinoId)?.name || form.contaDestinoId
    const desc = origemNome && destinoNome
      ? `${form.category}: ${origemNome} → ${destinoNome}${form.description ? ' — ' + form.description : ''}`
      : form.description || form.category

    setSubmitting(true)
    try {
      if (editingId) {
        await financeService.update(editingId, {
          description: desc,
          amount: parseFloat(form.amount),
          transactionDate: form.date,
        } as any)
        showToast('Transferência atualizada.')
      } else {
        await financeService.create({
          churchId: 2,
          type: 'EXPENSE',
          description: desc,
          amount: parseFloat(form.amount),
          transactionDate: form.date,
          categoryId: 1,
          accountId: form.contaOrigemId ? Number(form.contaOrigemId) : 1,
        } as any)
        showToast('Transferência registrada.')
      }
      setOpen(false)
      resetForm()
      loadAll()
    } catch {
      showToast('Falha ao salvar transferência.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Transferências' }]}
      title="Transferências"
      action={{ label: 'Nova Transferência', icon: <Plus className="h-4 w-4" />, onClick: () => { resetForm(); setOpen(true) } }}
    >
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
          <p className="text-xs text-brand-300 mb-1">Total Transferido</p>
          <p className="text-2xl font-extrabold text-brand-900">{formatCurrency(total)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
          <p className="text-xs text-brand-300 mb-1">Lançamentos</p>
          <p className="text-2xl font-extrabold text-brand-900">{transactions.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Transferências Registradas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-brand-300">
              Nenhuma transferência registrada.
              <br />
              <button onClick={() => { resetForm(); setOpen(true) }} className="mt-3 text-brand-700 font-semibold text-sm hover:underline">
                Registrar agora
              </button>
            </div>
          ) : (
            <Table>
              <Thead>
                <tr><Th>Data</Th><Th>Descrição</Th><Th>Valor</Th><Th>Status</Th><Th>Ações</Th></tr>
              </Thead>
              <tbody>
                {transactions.map(t => (
                  <Tr key={t.id}>
                    <Td>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</Td>
                    <Td className="font-semibold">{t.description}</Td>
                    <Td className="font-semibold">{formatCurrency(t.amount)}</Td>
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
        title={editingId ? 'Editar Transferência' : 'Nova Transferência'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Categoria"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIAS_TRANSFERENCIA.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          {/* Contas cadastradas */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Conta Origem"
              value={form.contaOrigemId}
              onChange={e => setForm({ ...form, contaOrigemId: e.target.value })}
            >
              <option value="">— Selecione —</option>
              {config.contasECaixas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select
              label="Conta Destino"
              value={form.contaDestinoId}
              onChange={e => setForm({ ...form, contaDestinoId: e.target.value })}
            >
              <option value="">— Selecione —</option>
              {config.contasECaixas
                .filter(c => c !== form.contaOrigemId)
                .map(c => (
                  <option key={c} value={c}>{c}</option>
                ))
              }
            </Select>
          </div>

          <Input
            label="Observação"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Motivo ou referência (opcional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Data" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>

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
            {comprovante && <p className="text-xs text-brand-300 mt-1">{comprovante.name}</p>}
          </div>
        </form>
      </Modal>
    </Layout>
  )
}