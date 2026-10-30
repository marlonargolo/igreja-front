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
import { congregationsService, type Congregation } from '@/services/congregations.service'
import { useApp } from '@/lib/AppContext'

// Unidade "sede" não tem id de Congregação — usamos esta string como valor
// do seletor para representá-la.
const SEDE_UNIT = 'SEDE'

export default function Finance() {
  const showToast = useToast()
  const { church } = useApp()
  const [transfers, setTransfers] = useState<FinancialTransfer[]>([])
  const [units, setUnits] = useState<Congregation[]>([])
  const [accountsOrigem, setAccountsOrigem] = useState<FinancialAccount[]>([])
  const [accountsDestino, setAccountsDestino] = useState<FinancialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [form, setForm] = useState({
    unidadeOrigemId: SEDE_UNIT,
    contaOrigemId: '',
    unidadeDestinoId: SEDE_UNIT,
    contaDestinoId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => { loadAll() }, [church?.id])

  async function loadAll() {
    setLoading(true)
    try {
      const [transfersData, congs] = await Promise.all([
        financeAccountsService.listTransfers({ size: 100 }),
        church?.id ? congregationsService.listByChurch(Number(church.id)) : Promise.resolve([]),
      ])
      setTransfers(transfersData)
      setUnits(Array.isArray(congs) ? congs : [])
    } catch {
      showToast('Falha ao carregar transferências.')
      setTransfers([])
      setUnits([])
    } finally {
      setLoading(false)
    }
  }

  const total = transfers.reduce((s, t) => s + Number(t.amount), 0)

  function resetForm() {
    setForm({
      unidadeOrigemId: SEDE_UNIT, contaOrigemId: '', unidadeDestinoId: SEDE_UNIT, contaDestinoId: '',
      amount: '', date: new Date().toISOString().split('T')[0], description: '',
    })
    setAccountsOrigem([])
    setAccountsDestino([])
    setComprovante(null)
  }

  // Troca de unidade: carrega as contas da unidade escolhida e descarta a
  // conta anteriormente selecionada, que deixou de ser válida.
  async function loadAccountsForUnit(unitId: string, side: 'origem' | 'destino') {
    const congregationId = unitId === SEDE_UNIT ? undefined : Number(unitId)
    try {
      const list = await financeAccountsService.listActiveForUnit(congregationId)
      if (side === 'origem') setAccountsOrigem(list)
      else setAccountsDestino(list)
    } catch {
      showToast('Falha ao carregar contas da unidade selecionada.')
      if (side === 'origem') setAccountsOrigem([])
      else setAccountsDestino([])
    }
  }

  useEffect(() => {
    if (open) {
      loadAccountsForUnit(form.unidadeOrigemId, 'origem')
      loadAccountsForUnit(form.unidadeDestinoId, 'destino')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function changeUnidadeOrigem(unitId: string) {
    setForm(f => ({ ...f, unidadeOrigemId: unitId, contaOrigemId: '' }))
    loadAccountsForUnit(unitId, 'origem')
  }

  function changeUnidadeDestino(unitId: string) {
    setForm(f => ({ ...f, unidadeDestinoId: unitId, contaDestinoId: '' }))
    loadAccountsForUnit(unitId, 'destino')
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
        {!church?.id ? (
          <p className="text-sm text-brand-400 bg-brand-50 rounded-lg px-3 py-2">
            Selecione uma Igreja para registrar uma transferência.
          </p>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unidade de origem"
              value={form.unidadeOrigemId}
              onChange={e => changeUnidadeOrigem(e.target.value)}
            >
              <option value={SEDE_UNIT}>{church?.name || 'Sede'} (sede)</option>
              {units.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </Select>
            <Select
              label="Conta Origem"
              value={form.contaOrigemId}
              onChange={e => setForm({ ...form, contaOrigemId: e.target.value })}
            >
              <option value="">— Selecione —</option>
              {accountsOrigem.map(a => (
                <option key={a.id} value={String(a.id)}>{a.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unidade de destino"
              value={form.unidadeDestinoId}
              onChange={e => changeUnidadeDestino(e.target.value)}
            >
              <option value={SEDE_UNIT}>{church?.name || 'Sede'} (sede)</option>
              {units.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </Select>
            <Select
              label="Conta Destino"
              value={form.contaDestinoId}
              onChange={e => setForm({ ...form, contaDestinoId: e.target.value })}
            >
              <option value="">— Selecione —</option>
              {accountsDestino
                .filter(a => !(form.unidadeDestinoId === form.unidadeOrigemId && String(a.id) === form.contaOrigemId))
                .map(a => (
                  <option key={a.id} value={String(a.id)}>{a.name}</option>
                ))}
            </Select>
          </div>

          {form.unidadeOrigemId && accountsOrigem.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Nenhuma conta ativa cadastrada para a unidade de origem selecionada.
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
        )}
      </Modal>
    </Layout>
  )
}
