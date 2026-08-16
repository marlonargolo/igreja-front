import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MapPin, ArrowRight, ChevronDown } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/Badge'
import { congregationsService, type Congregation } from '@/services'
import { useToast } from '@/components/ui/Extras'

export default function Congregations() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Todas')
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    congregationsService.list({ page: 0, size: 50 })
      .then(res => {
        setCongregations(res.data?.data || res.data || [])
      })
      .catch(() => {
        showToast('mensagem')
        setCongregations([])
      })
      .finally(() => setLoading(false))
  }, [])

  const cities = useMemo(() => {
    const all = congregations.map(c => c.city).filter(Boolean)
    return ['Todas', ...Array.from(new Set(all))]
  }, [congregations])

  const filtered = useMemo(
    () => congregations.filter((c) => {
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase())
      const matchesCity = city === 'Todas' || c.city === city
      return matchesQuery && matchesCity
    }),
    [congregations, query, city],
  )

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Congregações' }]}
      title="Congregações"
      searchPlaceholder="Buscar por nome..."
      action={{ label: 'Nova Congregação', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/congregacoes/nova') }}
    >
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar congregações por nome..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-100 bg-brand-50/50 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-brand-300"
          />
        </div>
        <div className="relative">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-brand-100 bg-white text-sm text-brand-700 outline-none focus:border-brand-500 cursor-pointer min-w-[170px]"
          >
            {cities.map((c) => <option key={c} value={c}>{c === 'Todas' ? 'Filtrar por Cidade' : c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex justify-center py-12 text-brand-300">Nenhuma congregação encontrada.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden flex flex-col">
              <img
                src={c.imageUrl || 'https://images.unsplash.com/photo-1542928123-74c1d7c4f00a'}
                alt={c.name}
                className="h-40 w-full object-cover"
              />
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-brand-900">{c.name}</h3>
                <p className="text-sm text-brand-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {c.city}, {c.state}
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge tone="blue">{c.members || 0} membros</Badge>
                  <Badge tone="blue">{c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-100">
                  <Badge tone="navy">{c.pastorName || 'Pastor'}</Badge>
                  <button
                    onClick={() => navigate(`/congregacoes/${c.id}`)}
                    className="text-sm font-semibold text-brand-700 hover:underline flex items-center gap-1"
                  >
                    Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}