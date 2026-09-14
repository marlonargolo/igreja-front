/**
 * ChurchSelection.tsx
 *
 * Para ROOT: exibe card especial "Administração do Sistema" no topo +
 *            aviso de que pode acessar sem selecionar uma igreja.
 * Para demais: exibe apenas as igrejas vinculadas ao usuário.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Cloud, MapPin, Loader2, LogOut, Building2, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useApp } from '@/lib/AppContext'
import { type Church } from '@/services/churches.service'
import { useToast } from '@/components/ui/Extras'
import { http, rootContext } from '@/lib/http'

export default function ChurchSelection() {
  const navigate = useNavigate()
  const { user, setChurch, logout } = useApp()
  const showToast = useToast()

  const [churches, setChurches] = useState<Church[]>([])
  const [loading,  setLoading]  = useState(true)

  const isRoot = user?.roles?.includes('ROOT') ?? false

  useEffect(() => {
    http.get<any>('/churches/my')
      .then(res => {
        const raw = res?.data
        const list: Church[] = Array.isArray(raw?.data) ? raw.data
                             : Array.isArray(raw)       ? raw
                             : raw?.content             || []
        setChurches(list)

        // Uma única igreja disponível → entrar direto (apenas não-ROOT)
        if (list.length === 1 && !isRoot) {
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

  function goToAdminExterna() {
    // ROOT entra no modo global sem Igreja selecionada
    rootContext.setGlobal()
    navigate('/admin-externa/painel')
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
            className="h-9 w-9 rounded-full object-cover" alt={user?.name || 'Usuário'} />
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
          {isRoot
            ? 'Selecione a Igreja que deseja administrar ou acesse o painel do sistema.'
            : 'Selecione sua Igreja para continuar.'}
        </p>

        {/* Aviso ROOT */}
        {isRoot && (
          <div className="mb-8 bg-brand-50 border border-brand-200 rounded-2xl p-4 text-sm text-brand-700 text-left">
            <p><strong>Você está logado como ROOT.</strong> Pode acessar a Administração do Sistema sem selecionar uma igreja, ou entrar em qualquer igreja para gerenciá-la diretamente.</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">

            {/* Card de Administração do Sistema — apenas ROOT */}
            {isRoot && (
              <button onClick={goToAdminExterna}
                className="group bg-brand-800 rounded-2xl overflow-hidden hover:bg-brand-700 transition-all text-left hover:-translate-y-0.5 hover:shadow-soft">
                <div className="h-36 w-full flex items-center justify-center bg-brand-700/50">
                  <Settings className="h-16 w-16 text-white/40 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white">Administração do Sistema</h3>
                  <p className="text-sm text-white/60 mt-1">
                    Gerencie todas as igrejas, congregações, usuários e documentos do sistema
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                    <span className="text-xs text-white/40">Exclusivo ROOT</span>
                    <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Cards de igrejas */}
            {churches.length === 0 && !isRoot ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-brand-300">
                <Building2 className="h-10 w-10 opacity-30" />
                <p className="font-medium">Nenhuma Igreja disponível para o seu perfil.</p>
                <p className="text-sm">Entre em contato com o administrador para solicitar acesso.</p>
                <button onClick={handleLogout} className="mt-4 text-sm text-brand-500 hover:underline flex items-center gap-1">
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              </div>
            ) : (
              churches.map(c => {
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
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}