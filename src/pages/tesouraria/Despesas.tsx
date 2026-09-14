/**
 * Despesas.tsx
 * - type: 'EXPENSE' em todas as chamadas
 * - Categorias carregadas do backend (tipo EXPENSE) + criação inline
 * - Contas carregadas do backend
 * - Comprovante sempre visível
 * - categoryId e accountId reais (não hardcoded)
 */
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
import { http } from '@/lib/http'

interface Category { id: number; name: string }
interface Account  { id: number; name: string }

export default function Despesas() {
  const showToast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories,   setCategories]   = useState<Category[]>([])
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [loading,      setLoading]      = useState(true)
  const [open,         setOpen]         = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [comprovante,  setComprovante]  = useState<File | null>(null)

  // "Nova categoria" digitada inline
  const [newCatName, setNewCatName] = useState('')
  const [addingCat,  setAddingCat]  = useState(false)

  const [form, setForm] = useState({
    description: '', amount: '',
    dateLancamento: new Date().toISOString().split('T')[0],
    dateVencimento: '', datePagamento: '',
    categoryId: '', accountId: '',
    isProvisao: false, parcelas: '1', fornecedor: '',
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [txRes, catRes, accRes] = await Promise.all([
        // type=EXPENSE garante que nunca vemos receitas
        financeService.list({ size: 200, type: 'EXPENSE' }) as any,
        // Categorias filtradas por EXPENSE e pela Igreja do usuário (via header)
        http.get<any>('/finance/categories/active', { type: 'EXPENSE' }),
        http.get<any>('/finance/accounts/active'),
      ])

      const txRaw = txRes as any
      setTransactions(txRaw?.data?.data || txRaw?.data?.content || txRaw?.data || [])

      const catRaw = catRes?.data
      setCategories(Array.isArray(catRaw?.data) ? catRaw.data
                  : Array.isArray(catRaw)       ? catRaw
                  : catRaw?.content             || [])

      const accRaw = accRes?.data
      setAccounts(Array.isArray(accRaw?.data) ? accRaw.data
                : Array.isArray(accRaw)       ? accRaw
                : accRaw?.content             || [])
    } catch {
      showToast('Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  /** Criar nova categoria EXPENSE inline e selecionar ela */
  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setAddingCat(true)
    try {
      const res = await http.post<any>('/finance/categories', {
        name: newCatName.trim(),
        type: 'EXPENSE',
        color: '#ef4444',
      })
      const raw = res?.data
      const created: Category = raw?.data || raw
      setCategories(prev => [...prev, created])
      setForm(f => ({ ...f, categoryId: String(created.id) }))
      setNewCatName('')
      showToast(`Categoria "${created.name}" adicionada.`)
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Falha ao criar categoria.')
    } finally {
      setAddingCat(false)
    }
  }

  const total   = useMemo(() => transactions.reduce((s, t) => s + Number(t.amount), 0), [transactions])
  const pending = useMemo(() => transactions.filter(t => t.status === 'PENDING').length,  [transactions])

  function resetForm() {
    setForm({
      description: '', amount: '',
      dateLancamento: new Date().toISOString().split('T')[0],
      dateVencimento: '', datePagamento: '',
      categoryId: categories[0] ? String(categories[0].id) : '',
      accountId:  accounts[0]   ? String(accounts[0].id)   : '',
      isProvisao: false, parcelas: '1', fornecedor: '',
    })
    setComprovante(null)
    setEditingId(null)
    setNewCatName('')
  }

  function openNew() { resetForm(); setOpen(true) }

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setForm({
      description: t.description, amount: String(t.amount),
      dateLancamento: t.transactionDate,
      dateVencimento: '', datePagamento: '',
      categoryId: t.categoryId ? String(t.categoryId) : '',
      accountId: '', isProvisao: false, parcelas: '1', fornecedor: '',
    })
    setComprovante(null)
    setOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta despesa?')) return
    try { await financeService.delete(id); showToast('Despesa excluída.'); loadAll() }
    catch { showToast('Falha ao excluir.') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) { showToast('Preencha descrição e valor.'); return }
    if (!editingId && !form.categoryId) { showToast('Selecione ou crie uma categoria.'); return }
    if (!editingId && !form.accountId)  { showToast('Selecione a conta.'); return }
    setSubmitting(true)
    try {
      if (editingId) {
        await financeService.update(editingId, {
          description: form.description,
          amount: parseFloat(form.amount),
          transactionDate: form.dateLancamento,
        } as any)
        showToast('Despesa atualizada.')
      } else {
        // type: 'EXPENSE' garante criação como despesa — nunca como receita
        const created = await financeService.create({
          type: 'EXPENSE',
          description: form.fornecedor
            ? `${form.description} — ${form.fornecedor}`
            : form.description,
          amount: parseFloat(form.amount),
          transactionDate: form.dateLancamento,
          categoryId: Number(form.categoryId),
          accountId:  Number(form.accountId),
          notes: form.isProvisao
            ? `Provisão | Vencimento: ${form.dateVencimento || '—'} | Parcelas: ${form.parcelas}`
            : undefined,
        } as any) as any

        // Upload comprovante (sempre disponível, não só em provisão)
        if (comprovante && created?.id) {
          try {
            await http.upload(`/finance/transactions/${created.id}/attachment`, comprovante, 'file')
          } catch { showToast('Despesa salva, mas falha ao anexar comprovante.') }
        }
        showToast('Despesa registrada.')
      }
      setOpen(false)
      resetForm()
      loadAll()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Falha ao salvar despesa.')
    } finally { setSubmitting(false) }
  }

  return (
    <Layout crumbs={[{ label: 'Tesouraria' }, { label: 'Despesas' }]} title="Despesas"
      action={{ label: 'Nova Despesa', icon: <Plus className="h-4 w-4" />, onClick: openNew }}>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total Despesas" value={formatCurrency(total)}    icon={<TrendingDown className="h-4 w-4" />} />
        <MetricCard label="Pendentes"       value={String(pending)}         icon={<TrendingDown className="h-4 w-4" />} tone="yellow" />
        <MetricCard label="Lançamentos"     value={String(transactions.length)} icon={<TrendingDown className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Lançamentos de Despesas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? <div className="py-8 text-center text-brand-300">Carregando...</div>
          : transactions.length === 0 ? <div className="py-8 text-center text-brand-300">Nenhuma despesa lançada.</div>
          : (
            <Table>
              <Thead>
                <tr><Th>Data</Th><Th>Descrição</Th><Th>Categoria</Th><Th>Valor</Th><Th>Status</Th><Th>Ações</Th></tr>
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
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => { setOpen(false); resetForm() }}
        title={editingId ? 'Editar Despesa' : 'Nova Despesa'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar Despesa'}
            </Button>
          </>
        }>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Categoria: select existente + campo inline para criar nova */}
          <div>
            <Select label="Categoria" value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Selecione a categoria —</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
            {/* Adicionar nova categoria inline */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Ou digite nova categoria..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-brand-100 outline-none focus:border-brand-500 placeholder:text-brand-300"
              />
              <Button type="button" size="sm" variant="outline"
                onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}>
                {addingCat ? '...' : '+ Adicionar'}
              </Button>
            </div>
          </div>

          {/* Conta */}
          {!editingId && (
            <Select label="Conta / Caixa" value={form.accountId}
              onChange={e => setForm({ ...form, accountId: e.target.value })}>
              <option value="">— Selecione a conta —</option>
              {accounts.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
            </Select>
          )}

          <Input label="Descrição" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} required />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Data do Lançamento" type="date" value={form.dateLancamento}
              onChange={e => setForm({ ...form, dateLancamento: e.target.value })} />
          </div>

          {/* Comprovante — sempre visível */}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Comprovante (opcional)
            </p>
            <input type="file" accept="image/*,application/pdf"
              onChange={e => setComprovante(e.target.files?.[0] || null)}
              className="text-sm text-brand-500" />
            {comprovante && <p className="text-xs text-brand-300 mt-1">{comprovante.name}</p>}
          </div>

          {/* Provisão toggle */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="provisao" checked={form.isProvisao}
              onChange={e => setForm({ ...form, isProvisao: e.target.checked })}
              className="h-4 w-4 rounded border-brand-200" />
            <label htmlFor="provisao" className="text-sm font-medium text-brand-700">
              Provisão (parcelamento / pagamento futuro)
            </label>
          </div>

          {form.isProvisao && (
            <div className="space-y-4 border-l-2 border-brand-100 pl-4">
              <Input label="Fornecedor" value={form.fornecedor}
                onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                placeholder="Ex: Sanepar, Copel..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data de Vencimento" type="date" value={form.dateVencimento}
                  onChange={e => setForm({ ...form, dateVencimento: e.target.value })} />
                <Input label="Data de Pagamento" type="date" value={form.datePagamento}
                  onChange={e => setForm({ ...form, datePagamento: e.target.value })} />
              </div>
              <Input label="Número de Parcelas" type="number" min="1" max="120"
                value={form.parcelas}
                onChange={e => setForm({ ...form, parcelas: e.target.value })} />
            </div>
          )}
        </form>
      </Modal>
    </Layout>
  )
}