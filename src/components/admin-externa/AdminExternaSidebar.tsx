// src/components/admin-externa/AdminExternaSidebar.tsx
//
// Barra lateral exclusiva da Administração Externa — identidade visual
// distinta (fundo slate-950 + acento âmbar) para deixar claro que esta é
// uma central de controle global, separada do layout padrão do sistema.
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Building2, MapPin, Users, FileText, Blocks,
  ScrollText, SlidersHorizontal, ChevronsLeft, ChevronsRight, X,
  ShieldHalf, LogOut, ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/format'
import { useApp } from '@/lib/AppContext'

const NAV = [
  { to: '/admin-externa/painel', label: 'Painel Geral', icon: LayoutGrid },
  { to: '/admin-externa/igrejas', label: 'Igrejas', icon: Building2 },
  { to: '/admin-externa/congregacoes', label: 'Congregações', icon: MapPin },
  { to: '/admin-externa/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin-externa/documentos', label: 'Documentações', icon: FileText },
  { to: '/admin-externa/modulos', label: 'Módulos', icon: Blocks },
  { to: '/admin-externa/auditoria', label: 'Auditoria', icon: ScrollText },
  { to: '/admin-externa/configuracoes', label: 'Configurações Globais', icon: SlidersHorizontal },
]

interface Props {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function AdminExternaSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: Props) {
  const { user, setUser, setChurch } = useApp()
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('igrejahub_access_token')
    localStorage.removeItem('igrejahub_refresh_token')
    setUser(null)
    setChurch(null)
    navigate('/login')
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-50 h-screen bg-slate-950 text-slate-200 flex flex-col transition-all duration-200 shrink-0 border-r border-amber-500/10',
        collapsed ? 'lg:w-[84px]' : 'lg:w-[264px]',
        'w-[270px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Marca */}
        <div className="flex items-center justify-between px-5 h-[68px] shrink-0 border-b border-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
              <ShieldHalf className="h-4.5 w-4.5 text-slate-950" />
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <span className="font-extrabold text-[15px] tracking-tight text-white whitespace-nowrap block">Painel do Sistema</span>
                <span className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Administração Externa</span>
              </div>
            )}
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Voltar à seleção de igrejas */}
        <button
          onClick={() => navigate('/selecionar-igreja')}
          className={cn(
            'mx-3 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white transition-colors',
            collapsed && 'justify-center',
          )}
          title="Voltar à seleção de igrejas"
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Selecionar Igreja</span>}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-none">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-400/15 text-amber-300 border border-amber-400/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent',
                collapsed && 'justify-center',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Recolher */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs font-medium"
        >
          {collapsed
            ? <ChevronsRight className="h-4 w-4 mx-auto" />
            : <><ChevronsLeft className="h-4 w-4" /> Recolher menu</>}
        </button>

        {/* Rodapé */}
        <div className="p-3 border-t border-white/5">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'ROOT')}&background=F59E0B&color=0f172a`}
              alt={user?.name || 'ROOT'}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate text-white">{user?.name || 'ROOT'}</p>
                <p className="text-[11px] text-amber-400/80 font-bold uppercase tracking-wide">ROOT</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sair"
              className="text-slate-400 hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
