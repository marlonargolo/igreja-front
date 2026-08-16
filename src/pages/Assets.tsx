// src/pages/Assets.tsx
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Package, Building2, Car, Wrench, ChevronDown } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/Misc'
import { Tabs } from '@/components/ui/Tabs'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/format'
import { EmptyState } from '@/components/ui/Misc'
import { assetsService, type Asset } from '@/services'
import { useToast } from '@/hooks/useToast'

const statusTone: Record<string, 'green' | 'yellow' | 'gray'> = {
  ACTIVE: 'green',
  MAINTENANCE: 'yellow',
  WRITTEN_OFF: 'gray',
}

export default function Assets() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [tab, setTab] = useState('Todos os Bens')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(['Todas'])

  const tabToCategory: Record<string, string> = {
    'Todos os Bens': 'Todas',
    Imóveis: 'Imóveis',
    Veículos: 'Veículos',
    Equipamentos: 'Equipamentos',
  }

  useEffect(() => {
    loadAssets()
  }, [tab, category])

  async function loadAssets() {
    setLoading(true)
    try {
      const catFilter = tab === 'Depreciação' ? undefined : (tabToCategory[tab] !== 'Todas' ? tabToCategory[tab] : undefined)
      const res = await assetsService.list({
        page: 0,
        size: 50,
        categoryId: category !== 'Todas' ? Number(category) : undefined,
      })
      setAssets(res.data || [])
      const uniqueCats = ['Todas', ...new Set(res.data.map(a => a.categoryName || 'Outros'))]
      setCategories(uniqueCats)
    } catch (err) {
      showToast('mensagem')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchesQuery = a.description.toLowerCase().includes(query.toLowerCase()) ||
        a.code.toLowerCase().includes(query.toLowerCase())
      const matchesCat = category === 'Todas' || a.categoryName === category
      return matchesQuery && matchesCat
    })
  }, [assets, query, category])

  const totals = useMemo(() => {
    return {
      total: assets.reduce((s, a) => s + a.currentValue, 0),
      imoveis: assets.filter(a => a.categoryName === 'Imóveis').reduce((s, a) => s + a.currentValue, 0),
      veiculos: assets.filter(a => a.categoryName === 'Veículos').reduce((s, a) => s + a.currentValue, 0),
      equipamentos: assets.filter(a => a.categoryName === 'Equipamentos').reduce((s, a) => s + a.currentValue, 0),
    }
  }, [assets])

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Patrimônio' }]}
      title="Patrimônio & Bens"
      searchPlaceholder="Buscar bens patrimoniais..."
      action={{ label: 'Novo Bem', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/patrimonio/novo') }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Bens" value={formatCurrency(totals.total)} icon={<Package className="h-4 w-4" />} />
        <MetricCard label="Imóveis" value={formatCurrency(totals.imoveis)} icon={<Building2 className="h-4 w-4" />} />
        <MetricCard label="Veículos" value={formatCurrency(totals.veiculos)} icon={<Car className="h-4 w-4" />} />
        <MetricCard label="Equipamentos" value={formatCurrency(totals.equipamentos)} icon={<Wrench className="h-4 w-4" />} />
      </div>

      <Tabs tabs={['Todos os Bens', 'Imóveis', 'Veículos', 'Equipamentos', 'Depreciação']} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'Depreciação' ? (
        <Card><CardBody className="pt-8 pb-10 text-center">
          <p className="text-sm text-brand-300">Relatório de depreciação disponível na aba Contabilidade &gt; DRE.</p>
        </CardBody></Card>
      ) : (
        <>
          <Card className="p-4 mb-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar por descrição, código ou placa..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-100 bg-brand-50/50 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-brand-300"
              />
            </div>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-brand-100 bg-white text-sm text-brand-700 outline-none min-w-[150px]"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300 pointer-events-none" />
            </div>
          </Card>

          <Card>
            {loading ? (
              <div className="py-8 text-center">Carregando...</div>
            ) : filtered.length === 0 ? (
              <EmptyState title="Nenhum bem encontrado" />
            ) : (
              <Table>
                <Thead>
                  <tr><Th>Código</Th><Th>Descrição</Th><Th>Categoria</Th><Th>Congregação</Th><Th>Valor Original</Th><Th>Valor Atual</Th><Th>Status</Th></tr>
                </Thead>
                <tbody>
                  {filtered.map((a) => (
                    <Tr key={a.id}>
                      <Td className="text-brand-500 font-medium">{a.code}</Td>
                      <Td className="font-semibold">{a.description}</Td>
                      <Td><Badge tone="blue">{a.categoryName || '—'}</Badge></Td>
                      <Td>{a.congregationName || '—'}</Td>
                      <Td className="text-brand-500">{formatCurrency(a.originalValue)}</Td>
                      <Td className="font-bold">{formatCurrency(a.currentValue)}</Td>
                      <Td><Badge tone={statusTone[a.status]}>{a.status}</Badge></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </Layout>
  )
}