import { useState, useEffect } from 'react'
import { Plus, Paperclip } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/components/ui/Extras'
import { financeAccountsService, type FinancialAccount, type FinancialTransfer } from '@/services/financeAccounts.service'
import { churchesService, type Church } from '@/services/churches.service'
import { useApp } from '@/lib/AppContext'

export default function Finance() {
  const showToast = useToast()
  const { isRoot } = useApp()
  const [transfers, setTransfers] = useState<FinancialTransfer[]>([])
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [form, setForm] = useState({
    churchOrigemId: '',
    contaOrigemId: '',
    churchDestinoId: '',
    contaDestinoId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [transfersData, accountsData] = await Promise.all([
        financeAccountsService.listTransfers({ size: 100 }),
        financeAccountsService.listActive(),
      ])
      setTransfers(transfersData)
      setAccounts(accountsData)
      // Igreja Origem/Destino só fazem sentido pra quem enxerga mais de uma
      // Igreja (ROOT) — os demais sempre transferem dentro da própria Igreja.
      if (isRoot) {
        const churchList = await churchesService.list()
        setChurches(Array.isArray(churchList) ? churchList : [])
      }
    } catch {
      showToast('Falha ao carregar transferências.')
      setTransfers([])
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const total = transfers.reduce((s, t) => s + Number(t.amount), 0)

  function resetForm() {
    setForm({
      churchOrigemId: '', contaOrigemId: '', churchDestinoId: '', contaDestinoId: '',
      amount: '', date: new Date().toISOString().split('T')[0], description: '',
    })
    setComprovante(null)
  }

  // Contas filtradas pela Igreja selecionada (só relevante pra ROOT, que vê
  // contas de várias Igrejas); sem Igreja escolhida, mostra todas as contas
  // a que o usuário tem acesso.
  function accountsFor(churchId: string) {
    if (!churchId) return accounts
    return accounts.filter(a => String(a.churchId ?? '') === churchId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contaOrigemId || !form.contaDestinoId) {
      showToast('Selecione a conta de origem e a de destino.')
      return
    }
    if (form.contaOrigemId === form.contaDestinoId) {
      showToast('Conta de origem e destino não podem ser iguais.')
      return
    }
    if (!form.amount) { showToast('Informe o valor.'); return }

    setSubmitting(true)
    try {
      await financeAccountsService.createTransfer({
        fromAccountId: Number(form.contaOrigemId),
        toAccountId: Number(form.contaDestinoId),
        amount: parseFloat(form.amount),
        transferDate: form.date,
        description: form.description || undefined,
      })
      showToast('Transferência registrada.')
      setOpen(false)
      resetForm()
      loadAll()
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Falha ao registrar a transferência.')
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
          <p className="text-2xl font-extrabold text-brand-900">{transfers.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Transferências Registradas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : transfers.length === 0 ? (
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
                <tr><Th>Data</Th><Th>Origem</Th><Th>Destino</Th><Th>Valor</Th><Th>Status</Th></tr>
              </Thead>
              <tbody>
                {transfers.map(t => (
                  <Tr key={t.id}>
                    <Td>{new Date(t.transferDate).toLocaleDateString('pt-BR')}</Td>
                    <Td className="font-semibold">
                      {t.fromAccountName}
                      {t.fromChurchName && <span className="block text-xs text-brand-300 font-normal">{t.fromChurchName}</span>}
                    </Td>
                    <Td className="font-semibold">
                      {t.toAccountName}
                      {t.toChurchName && <span className="block text-xs text-brand-300 font-normal">{t.toChurchName}</span>}
                    </Td>
                    <Td className="font-semibold">{formatCurrency(t.amount)}</Td>
                    <Td><Badge tone={t.status === 'CONFIRMED' ? 'green' : 'yellow'}>{t.status}</Badge></Td>
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
        title="Nova Transferência"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : 'Registrar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {isRoot && (
              <Select
                label="Igreja Origem"
                value={form.churchOrigemId}
                onChange={e => setForm({ ...form, churchOrigemId: e.target.value, contaOrigemId: '' })}
              >
                <option value="">— Todas as Igrejas —</option>
                {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>
            )}
            <Select
              label="Conta Origem"
              value={form.contaOrigemId}
              onChange={e => setForm({ ...form, contaOrigemId: e.target.value })}
            >
              <option value="">— Selecione —</option>
              {accountsFor(form.churchOrigemId).map(a => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}{a.churchName ? ` — ${a.churchName}` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isRoot && (
              <Select
                label="Igreja Destino"
                value={form.churchDestinoId}
                onChange={e => setForm({ ...form, churchDestinoId: e.target.value, contaDestinoId: '' })}
              >
                <option value="">— Todas as Igrejas —</option>
                {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>
            )}
            <Select
              label="Conta Destino"
              value={form.contaDestinoId}
              onChange={e => setForm({ ...form, contaDestinoId: e.target.value })}
            >
              <option value="">— Selecione —</option>
              {accountsFor(form.churchDestinoId)
                .filter(a => String(a.id) !== form.contaOrigemId)
                .map(a => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name}{a.churchName ? ` — ${a.churchName}` : ''}
                  </option>
                ))}
            </Select>
          </div>

          {accounts.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Nenhuma conta financeira ativa encontrada. Cadastre uma conta antes de registrar uma transferência.
            </p>
          )}

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
