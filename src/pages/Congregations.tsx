/**
 * Congregations.tsx — Corrigido
 *
 * MUDANÇAS:
 * 1. Dados reais do backend — sem mock de imagens do Unsplash
 * 2. Escopo aplicado: backend já filtra por permissão do usuário
 * 3. Imagem placeholder local quando não há imageUrl
 * 4. Quota do plano: mensagem ao atingir limite na criação
 */
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MapPin, ArrowRight, ChevronDown, Building2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/Badge'
import { congregationsService, type Congregation } from '@/services'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'

export default function Congregations() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { user: currentUser } = useApp()

  const isAdmin = currentUser?.roles?.some(r => ['ROOT', 'ADMIN', 'PASTOR_PRINCIPAL'].includes(r)) ?? false

  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Todas')
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // O backend já retorna apenas as congregações acessíveis para o usuário logado
    congregationsService.list({ page: 0, size: 100 })
      .then(res => {
        const list = res.data?.data?.data || res.data?.data || res.data?.content || res.data || []
        setCongregations(Array.isArray(list) ? list : [])
      })
      .catch(err => {
        const msg = err?.response?.data?.message || 'Falha ao carregar congregações.'
        showToast(msg)
        setCongregations([])
      })
      .finally(() => setLoading(false))
  }, [])

  const cities = useMemo(() => {
    const all = congregations.map(c => c.city).filter(Boolean)
    return ['Todas', ...Array.from(new Set(all))]
  }, [congregations])

  const filtered = useMemo(
    () => congregations.filter(c => {
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase())
      const matchesCity = city === 'Todas' || c.city === city
      return matchesQuery && matchesCity
    }),
    [congregations, query, city],
  )

  function handleNovaCongregacao() {
    navigate('/congregacoes/nova')
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Congregações' }]}
      title="Congregações"
      searchPlaceholder="Buscar por nome..."
      action={isAdmin ? {
        label: 'Nova Congregação',
        icon: <Plus className="h-4 w-4" />,
        onClick: handleNovaCongregacao,
      } : undefined}
    >
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar congregações por nome..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-100 bg-brand-50/50 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-brand-300"
          />
        </div>
        <div className="relative">
          <select value={city} onChange={e => setCity(e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-brand-100 bg-white text-sm text-brand-700 outline-none focus:border-brand-500 cursor-pointer min-w-[170px]">
            {cities.map(c => <option key={c} value={c}>{c === 'Todas' ? 'Filtrar por Cidade' : c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-brand-300">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-brand-300 gap-3">
          <Building2 className="h-10 w-10 opacity-30" />
          <p>Nenhuma congregação encontrada.</p>
          {!query && congregations.length === 0 && (
            <p className="text-xs">Seu perfil não possui congregações vinculadas ou nenhuma foi cadastrada ainda.</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden flex flex-col">
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center">
                  <span className="text-6xl font-extrabold text-white/20">{c.name.charAt(0)}</span>
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-brand-900">{c.name}</h3>
                {(c.city || c.state) && (
                  <p className="text-sm text-brand-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {c.members != null && <Badge tone="blue">{c.members} membros</Badge>}
                  <Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>
                    {c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-100">
                  {c.pastorName && <Badge tone="navy">{c.pastorName}</Badge>}
                  <button
                    onClick={() => navigate(`/congregacoes/${c.id}`)}
                    className="text-sm font-semibold text-brand-700 hover:underline flex items-center gap-1 ml-auto"
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
