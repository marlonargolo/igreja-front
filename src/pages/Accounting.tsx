// src/pages/Accounting.tsx
import { useState, useEffect } from 'react'
import { Plus, Landmark, TrendingDown, Package, TrendingUp, Download } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/Misc'
import { Tabs } from '@/components/ui/Tabs'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/format'
import { accountingService, type JournalEntry } from '@/services'
import { useToast } from '@/hooks/useToast'

export default function Accounting() {
  const [tab, setTab] = useState('Plano de Contas')
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [balanceSheet, setBalanceSheet] = useState({ assets: 0, liabilities: 0, equity: 0 })
  const [trialBalance, setTrialBalance] = useState<any[]>([])
  const [income, setIncome] = useState({ revenue: 0, expense: 0, result: 0 })
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      const today = new Date()
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const end = today.toISOString().split('T')[0]

      if (tab === 'Plano de Contas') {
        const bs = await accountingService.getBalanceSheet({ date: end })
        setBalanceSheet({
          assets: bs.assets_cents / 100,
          liabilities: bs.liabilities_cents / 100,
          equity: bs.equity_cents / 100,
        })
      } else if (tab === 'Lançamentos') {
        const res = await accountingService.listJournalEntries({ startDate: start, endDate: end, page: 0, size: 20 })
        setEntries(res.data || [])
      } else if (tab === 'Balancete') {
        const tb = await accountingService.getTrialBalance({ date: end })
        setTrialBalance(tb || [])
      } else if (tab === 'DRE') {
        const is = await accountingService.getIncomeStatement({ date_from: start, date_to: end })
        setIncome({
          revenue: is.revenue_cents / 100,
          expense: is.expense_cents / 100,
          result: is.result_cents / 100,
        })
      }
    } catch (err) {
      showToast('mensagem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Contabilidade' }]}
      title="Contabilidade Geral"
      searchPlaceholder="Pesquisar contas..."
      action={{ label: 'Novo Lançamento', icon: <Plus className="h-4 w-4" /> }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Ativo" value={formatCurrency(balanceSheet.assets)} icon={<Landmark className="h-4 w-4" />} />
        <MetricCard label="Total Passivo" value={formatCurrency(balanceSheet.liabilities)} icon={<TrendingDown className="h-4 w-4" />} />
        <MetricCard label="Patrimônio Líquido" value={formatCurrency(balanceSheet.equity)} icon={<Package className="h-4 w-4" />} />
        <MetricCard label="Resultado do Exercício" value={formatCurrency(income.result)} icon={<TrendingUp className="h-4 w-4" />} trend={income.result > 0 ? '+% este mês' : ''} />
      </div>

      <Tabs tabs={['Plano de Contas', 'Lançamentos', 'Balancete', 'DRE']} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'Plano de Contas' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Plano de Contas Estruturado</CardTitle>
            <button className="text-sm font-semibold text-brand-700 hover:underline flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> Exportar Plano (PDF)
            </button>
          </CardHeader>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center">Carregando...</div>
            ) : (
              <Table>
                <Thead>
                  <tr><Th>Código</Th><Th>Nome da Conta</Th><Th>Tipo</Th><Th className="text-right">Saldo Atual</Th></tr>
                </Thead>
                <tbody>
                  {trialBalance.map((acc) => (
                    <Tr key={acc.accountId}>
                      <Td className="text-brand-500">{acc.accountCode}</Td>
                      <Td style={{ paddingLeft: `${16 + (acc.level || 0) * 20}px` }} className="text-brand-700">
                        {acc.accountName}
                      </Td>
                      <Td><Badge tone="blue">Conta</Badge></Td>
                      <Td className="text-right font-bold">{formatCurrency(acc.balanceCents / 100)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'Lançamentos' && (
        <Card>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center">Carregando...</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-brand-300">Nenhum lançamento encontrado.</div>
            ) : (
              <Table>
                <Thead>
                  <tr><Th>Nº</Th><Th>Data</Th><Th>Descrição</Th><Th>Status</Th><Th className="text-right">Total</Th></tr>
                </Thead>
                <tbody>
                  {entries.map((e) => (
                    <Tr key={e.id}>
                      <Td className="text-brand-500">{e.entryNumber}</Td>
                      <Td>{new Date(e.entryDate).toLocaleDateString()}</Td>
                      <Td className="font-semibold">{e.description}</Td>
                      <Td><Badge tone={e.status === 'POSTED' ? 'green' : 'yellow'}>{e.status}</Badge></Td>
                      <Td className="text-right font-bold">{formatCurrency(e.totalDebit / 100)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'Balancete' && (
        <Card>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center">Carregando...</div>
            ) : trialBalance.length === 0 ? (
              <div className="py-8 text-center text-brand-300">Balancete mensal consolidado.</div>
            ) : (
              <Table>
                <Thead>
                  <tr><Th>Código</Th><Th>Conta</Th><Th className="text-right">Débito</Th><Th className="text-right">Crédito</Th><Th className="text-right">Saldo</Th></tr>
                </Thead>
                <tbody>
                  {trialBalance.map((acc) => (
                    <Tr key={acc.accountId}>
                      <Td className="text-brand-500">{acc.accountCode}</Td>
                      <Td>{acc.accountName}</Td>
                      <Td className="text-right">{formatCurrency(acc.debitCents / 100)}</Td>
                      <Td className="text-right">{formatCurrency(acc.creditCents / 100)}</Td>
                      <Td className="text-right font-bold">{formatCurrency(acc.balanceCents / 100)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'DRE' && (
        <Card>
          <CardBody className="pt-6">
            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div>
                <p className="text-sm text-brand-300">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(income.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-brand-300">Despesas</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(income.expense)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-brand-300">Resultado</p>
                <p className={`text-3xl font-extrabold ${income.result >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(income.result)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </Layout>
  )
}