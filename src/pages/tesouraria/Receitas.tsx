import { useEffect, useState, useMemo } from 'react'
import { Plus, TrendingUp, Edit2, Trash2 } from 'lucide-react'
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
import { useConfig } from '@/lib/ConfigContext'
import { useApp } from '@/lib/AppContext'


// REMOVA esta linha - está causando o erro
// const CATEGORIAS_RECEITA = categoriasFinanceiras.filter(c => ...)

export default function Receitas() {
  const showToast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { categoriasFinanceiras } = useConfig()
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Dízimo',
  })
  const { church } = useApp()

  // MOVA a constante para DENTRO do componente, DEPOIS de obter categoriasFinanceiras
  const CATEGORIAS_RECEITA = categoriasFinanceiras.filter(c =>
    !c.toLowerCase().includes('agua') &&
    !c.toLowerCase().includes('luz') &&
    !c.toLowerCase().includes('aluguel') &&
    !c.toLowerCase().includes('material') &&
    !c.toLowerCase().includes('manutencao') &&
    !c.toLowerCase().includes('equipamento')
  )

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
      try {
      const res = await financeService.list({ size: 100, type: 'REVENUE' }) as any
      const list = res?.data?.data || res?.data?.content || res?.data || res || []
      setTransactions(Array.isArray(list) ? list : [])
    } catch {
      showToast('Falha ao carregar receitas.')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const total = useMemo(() => transactions.reduce((s, t) => s + Number(t.amount), 0), [transactions])

  function openNew() {
    setEditingId(null)
    setForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Dízimo' })
    setOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setForm({
      description: t.description,
      amount: String(t.amount),
      date: t.transactionDate,
      category: t.categoryName || 'Dízimo',
    })
    setOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta receita?')) return
    try {
      await financeService.delete(id)
      showToast('Receita excluída.')
      load()
    } catch {
      showToast('Falha ao excluir.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await financeService.update(editingId, {
          description: form.description,
          amount: parseFloat(form.amount),
          transactionDate: form.date,
        } as any)
        showToast('Receita atualizada com sucesso.')
      } else {
        await financeService.create({
          churchId: church?.id ? Number(church.id) : undefined,
          type: 'REVENUE',
          description: form.description,
          amount: parseFloat(form.amount),
          transactionDate: form.date,
          categoryId: 1,
          accountId: 1,
        } as any)
        showToast('Receita registrada com sucesso.')
      }
      setEditingId(null)
      setOpen(false)
      load()
    } catch {
      showToast('Falha ao salvar receita.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Receitas' }]}
      title="Receitas"
      action={{ label: 'Nova Receita', icon: <Plus className="h-4 w-4" />, onClick: openNew }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total de Receitas" value={formatCurrency(total)} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Lançamentos" value={String(transactions.length)} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Lançamentos de Receitas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-brand-300">Nenhuma receita lançada.</div>
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
                    <Td><Badge tone="green">{t.categoryName || '—'}</Badge></Td>
                    <Td className="text-green-600 font-semibold">{formatCurrency(t.amount)}</Td>
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
        onClose={() => { setOpen(false); setEditingId(null) }}
        title={editingId ? 'Editar Receita' : 'Nova Receita'}
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
          <Select label="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIAS_RECEITA.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Data" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
        </form>
      </Modal>
    </Layout>
  )
}