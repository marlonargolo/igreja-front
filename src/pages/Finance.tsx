// src/pages/Finance.tsx
import { useMemo, useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/Misc'
import { Tabs } from '@/components/ui/Tabs'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/components/ui/Extras'
import { financeService, type Transaction } from '@/services'
import { dashboardService } from '@/services/dashboard.service'

export default function Finance() {
  const [tab, setTab] = useState('Visão Geral')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newTx, setNewTx] = useState({ type: 'REVENUE', description: '', amount: '', date: '', categoryId: 1 })
  const [submitting, setSubmitting] = useState(false)
  const showToast = useToast()

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const firstDay = `${year - 1}-01-01`   // ano passado para pegar os dados de 2025
  const lastDay = `${year}-12-31`

  useEffect(() => {
    loadData()
  }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      const typeFilter = tab === 'Receitas' ? 'REVENUE' : tab === 'Despesas' ? 'EXPENSE' : undefined
      const res = await financeService.list({
        page: 0,
        size: 20,
        startDate: firstDay,
        endDate: lastDay,
        type: typeFilter,
      })
      setTransactions(Array.isArray(res.data) ? res.data : (res.data?.data || []))

      // Buscar métricas do dashboard
      const metrics = await dashboardService.getMetrics({ startDate: firstDay, endDate: lastDay })
      setSummary({
        totalRevenue: metrics.monthlyRevenue || 0,
        totalExpenses: metrics.monthlyExpenses || 0,
        balance: metrics.balance || 0,
      })
    } catch (err) {
      showToast('mensagem')
    } finally {
      setLoading(false)
    }
  }

  const filteredTx = useMemo(() => {
    if (tab === 'Receitas') return transactions.filter(t => t.type === 'REVENUE')
    if (tab === 'Despesas') return transactions.filter(t => t.type === 'EXPENSE')
    return transactions
  }, [transactions, tab])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await financeService.create({
        churchId: 1, // substituir por lógica real
        congregationId: undefined,
        categoryId: newTx.categoryId,
        type: newTx.type as 'REVENUE' | 'EXPENSE',
        description: newTx.description,
        amount: parseFloat(newTx.amount),
        transactionDate: newTx.date || firstDay,
      })
      showToast('mensagem')
      setOpen(false)
      setNewTx({ type: 'REVENUE', description: '', amount: '', date: '', categoryId: 1 })
      loadData()
    } catch (err) {
      showToast('mensagem')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Financeiro' }]}
      title="Painel Financeiro"
      searchPlaceholder="Buscar transações..."
      action={{ label: 'Nova Transação', icon: <Plus className="h-4 w-4" />, onClick: () => setOpen(true) }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Receitas do Mês" value={formatCurrency(summary.totalRevenue)} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Despesas do Mês" value={formatCurrency(summary.totalExpenses)} icon={<TrendingDown className="h-4 w-4" />} trendUp={false} />
        <MetricCard label="Saldo do Mês" value={formatCurrency(summary.balance)} icon={<Wallet className="h-4 w-4" />} />
        <MetricCard label="Receitas Acumuladas" value={formatCurrency(summary.totalRevenue)} icon={<PiggyBank className="h-4 w-4" />} />
      </div>

      <Tabs tabs={['Visão Geral', 'Receitas', 'Despesas', 'Transferências']} active={tab} onChange={setTab} className="mb-6" />

      {tab !== 'Transferências' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{tab === 'Visão Geral' ? 'Últimas Transações' : tab}</CardTitle>
          </CardHeader>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center">Carregando...</div>
            ) : filteredTx.length === 0 ? (
              <div className="py-8 text-center text-brand-300">Nenhuma transação encontrada.</div>
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Data</Th><Th>Descrição</Th><Th>Categoria</Th><Th>Congregação</Th><Th>Valor</Th><Th>Status</Th>
                  </tr>
                </Thead>
                <tbody>
                  {filteredTx.map((t) => (
                    <Tr key={t.id}>
                      <Td className="text-brand-500">{new Date(t.transactionDate).toLocaleDateString()}</Td>
                      <Td className="font-semibold">{t.description}</Td>
                      <Td><Badge tone={t.type === 'REVENUE' ? 'green' : 'red'}>{t.categoryName}</Badge></Td>
                      <Td className="text-brand-500">{t.congregationName || '—'}</Td>
                      <Td className={`font-semibold ${t.type === 'EXPENSE' ? 'text-red-500' : 'text-green-600'}`}>
                        {formatCurrency(t.amount)}
                      </Td>
                      <Td><Badge tone={t.status === 'CONFIRMED' ? 'green' : 'yellow'}>{t.status}</Badge></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'Transferências' && (
        <Card><CardBody className="pt-8 pb-10 text-center">
          <p className="text-sm text-brand-300">Nenhuma transferência registrada entre congregações neste período.</p>
        </CardBody></Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova Transação"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Transação'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Tipo"
            value={newTx.type}
            onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
          >
            <option value="REVENUE">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </Select>
          <Input
            label="Descrição"
            value={newTx.description}
            onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              required
            />
            <Input
              label="Data"
              type="date"
              value={newTx.date || firstDay}
              onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
            />
          </div>
          <Select
            label="Categoria"
            value={String(newTx.categoryId)}
            onChange={(e) => setNewTx({ ...newTx, categoryId: Number(e.target.value) })}
            required
          >
            <option value="1">Dízimo</option>
            <option value="2">Oferta</option>
            <option value="3">Campanha</option>
            <option value="4">Manutenção</option>
            <option value="5">Utilidades</option>
            <option value="6">Equipamentos</option>
          </Select>
        </form>
      </Modal>
    </Layout>
  )
}