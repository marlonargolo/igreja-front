import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, Users, Share2, Wallet, Package, Landmark, FileBarChart,
  UsersRound, Settings, ChevronsLeft, ChevronsRight, X, Cloud,
} from 'lucide-react'
import { cn } from '@/lib/format'
import { useApp } from '@/lib/AppContext'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/membros', label: 'Membros', icon: Users },
  { to: '/congregacoes', label: 'Congregações', icon: Share2 },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/patrimonio', label: 'Patrimônio', icon: Package },
  { to: '/contabilidade', label: 'Contabilidade', icon: Landmark },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { to: '/usuarios', label: 'Usuários', icon: UsersRound },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { church } = useApp()

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-brand-900/50 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-brand-800 text-white flex flex-col transition-all duration-200 shrink-0',
          collapsed ? 'lg:w-[84px]' : 'lg:w-[248px]',
          'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-5 h-[68px] shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <Cloud className="h-4.5 w-4.5 text-brand-800" fill="currentColor" />
            </div>
            {!collapsed && <span className="font-extrabold text-lg tracking-tight whitespace-nowrap">IgrejaHub</span>}
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center',
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs font-medium"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4 mx-auto" /> : <><ChevronsLeft className="h-4 w-4" /> Recolher menu</>}
        </button>

        <div className="p-3 border-t border-white/10 space-y-3">
          {!collapsed && (
            <div className="bg-white/10 rounded-xl px-3.5 py-3">
              <p className="text-sm font-semibold truncate">{church?.name ?? 'Sede Central de Curitiba'}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-white/60">Plano Premium Multi</span>
                <span className="text-[10px] font-bold bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded">Ativo</span>
              </div>
            </div>
          )}
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <img src="https://i.pravatar.cc/150?u=carlos-eduardo" alt="Pr. Carlos Santos" className="h-9 w-9 rounded-full object-cover shrink-0" />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">Pr. Carlos Santos</p>
                <p className="text-xs text-white/50 truncate">carlos@igrejahub.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
