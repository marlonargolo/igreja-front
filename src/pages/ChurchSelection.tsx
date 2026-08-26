import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Cloud, MapPin, Loader2, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useApp } from '@/lib/AppContext'
import { churchesService, type Church } from '@/services/churches.service'
import { useToast } from '@/components/ui/Extras'
import { resolveLogoUrl } from '@/services/churches.service'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

const ADMIN_ROLES = ['ROOT', 'ADMIN']

export default function ChurchSelection() {
  const navigate = useNavigate()
  const { user, setChurch, logout } = useApp()
  const showToast = useToast()
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false

  useEffect(() => {
    if (isAdmin) {
      // ROOT/ADMIN vê todas as igrejas diretamente
      churchesService.list()
        .then(list => {
          setChurches(list)
          if (list.length === 1) {
            const c = list[0]
            setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
            navigate('/dashboard', { replace: true })
          }
        })
        .catch(() => showToast('Falha ao carregar igrejas.'))
        .finally(() => setLoading(false))
    } else {
      // Demais usuários: apenas igrejas vinculadas
      http.get<any>('/churches/my')
        .then(res => {
          const raw = (res as any)
          const list: Church[] = Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : raw?.data?.content || []
          setChurches(list)
          if (list.length === 1) {
            const c = list[0]
            setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
            navigate('/dashboard', { replace: true })
          }
        })
        .catch(() => showToast('Falha ao carregar igrejas.'))
        .finally(() => setLoading(false))
    }
  }, [])

  function select(church: Church) {
    setChurch({ id: String(church.id), name: church.name, city: church.city || '', state: church.state || '' })
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
            <p className="text-sm font-semibold text-brand-900 leading-tight">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-brand-300">{user?.organizationName || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-brand-300 hover:text-brand-700 rounded-lg hover:bg-brand-50"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-brand-900">
          Bem-vindo, {user?.name?.split(' ')[0] || 'Pastor'}!
        </h1>
        <p className="text-brand-300 mt-2 mb-10">
          {isAdmin
            ? 'Selecione qual congregação deseja administrar hoje.'
            : 'Acesse sua congregação abaixo.'}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
          </div>
        ) : churches.length === 0 ? (
          <div className="py-20 text-brand-300">
            <p>Nenhuma congregação disponível para seu perfil.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {churches.map(church => (
              <button
                key={church.id}
                onClick={() => select(church)}
                className="group bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all text-left"
              >
                <div className="h-36 w-full overflow-hidden bg-brand-50 flex items-center justify-center">
                  {church.logoUrl ? (
                    <img 
                        src={church.logoUrl 
                          ? (church.logoUrl.startsWith('http') 
                              ? church.logoUrl 
                              : `http://2.24.80.229:3000${church.logoUrl}`) 
                          : undefined
                        } 
                        alt={church.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                  ) : (
                    <Cloud className="h-12 w-12 text-brand-200" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-brand-900">{church.name}</h3>
                  <p className="text-sm text-brand-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[church.city, church.state].filter(Boolean).join(', ') || 'Localização não informada'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge tone={church.status === 'ACTIVE' ? 'green' : 'gray'}>
                      {church.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-100">
                    <span className="text-xs text-brand-300">{church.email || ''}</span>
                    <span className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 group-hover:bg-brand-800 group-hover:text-white transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isAdmin && churches.length > 0 && (
          <button
            onClick={() => {
              setChurch({ id: 'ALL', name: 'Todas as Congregações', city: 'Multi', state: '' })
              navigate('/dashboard')
            }}
            className="text-brand-700 font-semibold text-sm mt-10 hover:underline"
          >
            Gerenciar todas as congregações (Acesso Administrador)
          </button>
        )}
      </div>
    </div>
  )
}