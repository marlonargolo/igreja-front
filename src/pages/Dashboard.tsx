// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Share2, TrendingUp, TrendingDown, Landmark, UsersRound, UserPlus, Download } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { MetricCard } from '@/components/ui/Misc'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  BarChart, Bar,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import { dashboardService } from '@/services/dashboard.service'
import { congregationsService } from '@/services/congregations.service'
import { useToast } from '@/components/ui/Extras'

// Dados mockados para gráficos (enquanto a API não fornece séries históricas)
const monthlyFlowMock = [
  { month: 'Jan', revenue: 12000, expenses: 7000 },
  { month: 'Fev', revenue: 15000, expenses: 8000 },
  { month: 'Mar', revenue: 18000, expenses: 9000 },
  { month: 'Abr', revenue: 16000, expenses: 8500 },
  { month: 'Mai', revenue: 20000, expenses: 10000 },
  { month: 'Jun', revenue: 22000, expenses: 11000 },
]

const memberGrowthMock = [
  { month: 'Jan', novos: 18 },
  { month: 'Fev', novos: 22 },
  { month: 'Mar', novos: 35 },
  { month: 'Abr', novos: 20 },
  { month: 'Mai', novos: 31 },
  { month: 'Jun', novos: 40 },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [congregations, setCongregations] = useState<any[]>([])

  useEffect(() => {
    // Buscar dados do dashboard sem parâmetros (ou com parâmetros mínimos)
    Promise.all([
      dashboardService.getMetrics(),
      congregationsService.list({ page: 0, size: 10 }),
    ])
      .then(([metricsData, congregationsRes]) => {
        setMetrics(metricsData)
        setCongregations(congregationsRes.data?.data || congregationsRes.data || [])
      })
      .catch((err) => {
        console.error('Erro ao carregar dashboard:', err)
        showToast('mensagem')
        // Fallback com dados vazios para não quebrar a UI
        setMetrics({
          totalMembers: 0,
          totalChurches: 0,
          totalCongregations: 0,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          balance: 0,
          totalAssets: 0,
          activeUsers: 0,
          pendingTransactions: 0,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Dashboard' }]} title="Painel Geral">
        <div className="flex items-center justify-center h-64">Carregando dados...</div>
      </Layout>
    )
  }

  // Se não tiver métricas, usa objeto vazio
  const m = metrics || {
    totalMembers: 0,
    totalChurches: 0,
    totalCongregations: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    balance: 0,
    totalAssets: 0,
    activeUsers: 0,
    pendingTransactions: 0,
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Dashboard' }]}
      title="Painel Geral"
      searchPlaceholder="Buscar congregação..."
      action={{ label: 'Novo Membro', icon: <UserPlus className="h-4 w-4" />, onClick: () => navigate('/membros/novo') }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard label="Total de Membros" value={m.totalMembers.toLocaleString()} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Congregações" value={m.totalCongregations.toString()} icon={<Share2 className="h-4 w-4" />} />
        <MetricCard label="Receitas do Mês" value={formatCurrency(m.monthlyRevenue)} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Despesas do Mês" value={formatCurrency(m.monthlyExpenses)} icon={<TrendingDown className="h-4 w-4" />} trendUp={false} />
        <MetricCard label="Patrimônio Total" value={formatCurrency(m.totalAssets)} icon={<Landmark className="h-4 w-4" />} />
        <MetricCard label="Usuários Ativos" value={m.activeUsers.toString()} icon={<UsersRound className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Receitas vs Despesas</CardTitle>
            <div className="flex items-center gap-4 text-xs text-brand-300">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-800" /> Receitas</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-300" /> Despesas</span>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyFlowMock} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE7F1" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#667789' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#667789' }} axisLine={false} tickLine={false} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#203B59" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#4B739B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Crescimento de Membros</CardTitle>
            <span className="text-xs text-brand-300">Novos membros / mês</span>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={memberGrowthMock} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE7F1" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#667789' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#667789' }} axisLine={false} tickLine={false} />
                <RTooltip />
                <Bar dataKey="novos" radius={[6, 6, 0, 0]} fill="#4B739B" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Dados por Congregação</CardTitle>
          <button className="text-sm font-semibold text-brand-700 hover:underline flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </CardHeader>
        <CardBody className="pt-3">
          {congregations.length === 0 ? (
            <div className="py-4 text-center text-brand-300">Nenhuma congregação cadastrada.</div>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Congregação</Th>
                  <Th>Membros</Th>
                  <Th>Receitas</Th>
                  <Th>Despesas</Th>
                  <Th className="text-right">Saldo</Th>
                </tr>
              </Thead>
              <tbody>
                {congregations.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-semibold">{c.name}</Td>
                    <Td>{c.members || 0}</Td>
                    <Td className="text-green-600 font-medium">{formatCurrency(c.revenue || 0)}</Td>
                    <Td className="text-red-500 font-medium">{formatCurrency(c.expenses || 0)}</Td>
                    <Td className={`text-right font-bold ${(c.revenue || 0) - (c.expenses || 0) < 0 ? 'text-red-500' : 'text-brand-900'}`}>
                      {formatCurrency((c.revenue || 0) - (c.expenses || 0))}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}