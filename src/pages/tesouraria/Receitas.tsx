/**
 * Receitas.tsx
 * - Carrega categorias REVENUE do backend (/finance/categories/active?type=REVENUE)
 * - Carrega contas ativas da Igreja (/finance/accounts/active)
 * - Carrega membros da Igreja para vincular dízimo/oferta
 * - Filtra listagem: type=REVENUE (nunca mostra despesas)
 * - churchId NÃO enviado: backend usa header X-Church-Id
 */
import { useEffect, useState, useMemo } from 'react'
import { Plus, TrendingUp, Edit2, Trash2, UserPlus } from 'lucide-react'
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
interface Member   { id: number; name: string }

export default function Receitas() {
  const showToast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories,   setCategories]   = useState<Category[]>([])
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [members,      setMembers]      = useState<Member[]>([])
  const [loading,      setLoading]      = useState(true)
  const [open,         setOpen]         = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)

  const [form, setForm] = useState({
    description: '', amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '', accountId: '', memberId: '',
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [txRes, catRes, accRes, memRes] = await Promise.all([
        // type=REVENUE garante que nunca vemos despesas
        financeService.list({ size: 200, type: 'REVENUE' }) as any,
        // Categorias filtradas por tipo REVENUE e pela Igreja do usuário (header)
        http.get<any>('/finance/categories/active', { type: 'REVENUE' }),
        http.get<any>('/finance/accounts/active'),
        // Membros da Igreja (backend filtra pelo header X-Church-Id)
        http.get<any>('/members', { page: 0, size: 500, status: 'ACTIVE' }),
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

      const memRaw = memRes?.data
      const memList = memRaw?.data?.data || memRaw?.data || memRaw?.content || []
      setMembers(Array.isArray(memList) ? memList : [])
    } catch (err: any) {
      showToast('Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const total    = useMemo(() => transactions.reduce((s, t) => s + Number(t.amount), 0), [transactions])
  const pending  = useMemo(() => transactions.filter(t => t.status === 'PENDING').length,   [transactions])
  const confirmed = useMemo(() => transactions.filter(t => t.status === 'CONFIRMED').length, [transactions])

  function openNew() {
    setEditingId(null)
    setForm({
      description: '', amount: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: categories[0] ? String(categories[0].id) : '',
      accountId:  accounts[0]   ? String(accounts[0].id)   : '',
      memberId:   '',
    })
    setOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setForm({
      description: t.description, amount: String(t.amount),
      date: t.transactionDate,
      categoryId: t.categoryId ? String(t.categoryId) : '',
      accountId:  '', memberId: (t as any).memberId ? String((t as any).memberId) : '',
    })
    setOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta receita?')) return
    try { await financeService.delete(id); showToast('Receita excluída.'); loadAll() }
    catch { showToast('Falha ao excluir.') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) { showToast('Preencha descrição e valor.'); return }
    if (!editingId && !form.accountId) { showToast('Selecione a conta.'); return }
    if (!editingId && !form.categoryId) { showToast('Selecione a categoria.'); return }
    setSubmitting(true)
    try {
      if (editingId) {
        await financeService.update(editingId, {
          description: form.description, amount: parseFloat(form.amount), transactionDate: form.date,
          memberId: form.memberId ? Number(form.memberId) : undefined,
        } as any)
        showToast('Receita atualizada.')
      } else {
        // churchId não enviado — backend usa X-Church-Id
        await financeService.create({
          type: 'REVENUE',
          description: form.description,
          amount: parseFloat(form.amount),
          transactionDate: form.date,
          categoryId: Number(form.categoryId),
          accountId:  Number(form.accountId),
          memberId:   form.memberId ? Number(form.memberId) : undefined,
        } as any)
        showToast('Receita registrada.')
      }
      setOpen(false); setEditingId(null); loadAll()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Falha ao salvar.')
    } finally { setSubmitting(false) }
  }

  return (
    <Layout crumbs={[{ label: 'Tesouraria' }, { label: 'Receitas' }]} title="Receitas"
      action={{ label: 'Nova Receita', icon: <Plus className="h-4 w-4" />, onClick: openNew }}>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total"     value={formatCurrency(total)}    icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Pendentes" value={String(pending)}          icon={<TrendingUp className="h-4 w-4" />} tone="yellow" />
        <MetricCard label="Confirmados" value={String(confirmed)}      icon={<TrendingUp className="h-4 w-4" />} tone="green" />
      </div>

      <Card>
        <CardHeader><CardTitle>Lançamentos de Receitas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? <div className="py-8 text-center text-brand-300">Carregando...</div>
          : transactions.length === 0 ? <div className="py-8 text-center text-brand-300">Nenhuma receita lançada.</div>
          : (
            <Table>
              <Thead>
                <tr><Th>Data</Th><Th>Descrição</Th><Th>Membro</Th><Th>Categoria</Th><Th>Valor</Th><Th>Status</Th><Th>Ações</Th></tr>
              </Thead>
              <tbody>
                {transactions.map(t => (
                  <Tr key={t.id}>
                    <Td>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</Td>
                    <Td className="font-semibold">{t.description}</Td>
                    <Td className="text-brand-400 text-sm">{(t as any).memberName || '—'}</Td>
                    <Td><Badge tone="green">{t.categoryName || '—'}</Badge></Td>
                    <Td className="text-green-600 font-semibold">{formatCurrency(t.amount)}</Td>
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

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(null) }}
        title={editingId ? 'Editar Receita' : 'Nova Receita'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}
            </Button>
          </>
        }>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Categoria — apenas REVENUE, da Igreja do usuário */}
          <Select label="Categoria" value={form.categoryId}
            onChange={e => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">— Selecione a categoria —</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>

          {/* Conta — apenas da Igreja do usuário */}
          {!editingId && (
            <Select label="Conta / Caixa" value={form.accountId}
              onChange={e => setForm({ ...form, accountId: e.target.value })}>
              <option value="">— Selecione a conta —</option>
              {accounts.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
            </Select>
          )}

          {/* Membro — opcional, para vincular dízimo/oferta */}
          <Select label="Membro (opcional — dízimo / oferta)" value={form.memberId}
            onChange={e => setForm({ ...form, memberId: e.target.value })}>
            <option value="">— Sem membro vinculado —</option>
            {members.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
          </Select>

          <Input label="Descrição" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Data" type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
        </form>
      </Modal>
    </Layout>
  )
}