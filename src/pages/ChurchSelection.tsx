import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Cloud, MapPin, Loader2, LogOut, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useApp } from '@/lib/AppContext'
import { type Church } from '@/services/churches.service'
import { useToast } from '@/components/ui/Extras'
import { http } from '@/lib/http'

/**
 * Tela de seleção de Igreja.
 *
 * O backend (/churches/my) aplica o isolamento:
 *   ROOT → todas as igrejas da organização
 *   Outros → apenas a igreja vinculada ao usuário
 *   Sem vínculo → lista vazia
 *
 * O frontend NÃO filtra — apenas exibe o que o backend retornar.
 */
export default function ChurchSelection() {
  const navigate = useNavigate()
  const { user, setChurch, logout } = useApp()
  const showToast = useToast()

  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)

  const isRoot = user?.roles?.includes('ROOT') ?? false

  useEffect(() => {
    http.get<any>('/churches/my')
      .then(res => {
        const raw = res?.data
        const list: Church[] = Array.isArray(raw?.data) ? raw.data
                             : Array.isArray(raw)       ? raw
                             : raw?.content             || []
        setChurches(list)

        // Uma única igreja → entrar direto, sem tela de seleção
        if (list.length === 1) {
          const c = list[0]
          setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
          navigate('/dashboard', { replace: true })
        }
      })
      .catch(() => showToast('Falha ao carregar igrejas.'))
      .finally(() => setLoading(false))
  }, [])

  function select(c: Church) {
    setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
    navigate('/dashboard')
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 sm:px-10 h-[68px] border-b border-brand-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-800 flex items-center justify-center">
            <Cloud className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="font-extrabold text-lg text-brand-900">IgrejaHub</span>
        </div>
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1E3A5F&color=fff`}
            className="h-9 w-9 rounded-full object-cover"
            alt={user?.name || 'Usuário'}
          />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-brand-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-brand-300">{user?.organizationName || ''}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-brand-300 hover:text-brand-700 rounded-lg hover:bg-brand-50" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-brand-900">
          Bem-vindo, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-brand-300 mt-2 mb-10">
          {isRoot ? 'Selecione a Igreja que deseja administrar.' : 'Selecione sua Igreja para continuar.'}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
          </div>
        ) : churches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-300">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="font-medium">Nenhuma Igreja disponível para o seu perfil.</p>
            <p className="text-sm">Entre em contato com o administrador para solicitar acesso.</p>
            <button onClick={handleLogout} className="mt-4 text-sm text-brand-500 hover:underline flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {churches.map(c => {
              const logoUrl = c.logoUrl
                ? c.logoUrl.startsWith('http') ? c.logoUrl : `http://2.24.80.229:3000${c.logoUrl}`
                : null
              return (
                <button key={c.id} onClick={() => select(c)}
                  className="group bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all text-left">
                  <div className="h-36 w-full overflow-hidden bg-brand-50 flex items-center justify-center">
                    {logoUrl
                      ? <img src={logoUrl} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <span className="text-5xl font-extrabold text-brand-200">{c.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-brand-900">{c.name}</h3>
                    <p className="text-sm text-brand-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {[c.city, c.state].filter(Boolean).join(', ') || 'Localização não informada'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>
                        {c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-100">
                      <span className="text-xs text-brand-300 truncate max-w-[140px]">{c.email || ''}</span>
                      <span className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 group-hover:bg-brand-800 group-hover:text-white transition-colors shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}