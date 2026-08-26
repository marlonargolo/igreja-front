import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Wallet, Package, Landmark, BookUser, Settings,
  ChevronsLeft, ChevronsRight, X, Cloud, ChevronDown, ChevronRight,
  Building2, CreditCard, Palette, Plug, HardDrive, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/format'
import { Headphones } from 'lucide-react'
import { useApp } from '@/lib/AppContext'

interface NavItem {
  to?: string
  label: string
  icon: React.ElementType
  children?: { to: string; label: string }[]
}

const navPrincipal: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  {
    label: 'Configurações', icon: Settings,
    children: [
      { to: '/configuracoes/congregacoes', label: 'Congregações' },
      { to: '/usuarios', label: 'Usuários' },
    ],
  },
  {
    label: 'Secretaria', icon: BookUser,
    children: [
      { to: '/membros', label: 'Membros' },
      { to: '/secretaria/transferencias', label: 'Transferências' },
      { to: '/secretaria/credenciais', label: 'Credenciais' },
      { to: '/secretaria/relatorios', label: 'Relatórios' },
      { to: '/secretaria/configuracoes', label: 'Configurações' },
    ],
  },
  {
    label: 'Tesouraria', icon: Wallet,
    children: [
      { to: '/tesouraria/receitas', label: 'Receitas' },
      { to: '/tesouraria/despesas', label: 'Despesas' },
      { to: '/tesouraria/transferencias', label: 'Transferências' },
      { to: '/tesouraria/relatorios', label: 'Relatórios' },
      { to: '/tesouraria/configuracoes', label: 'Configurações' },
    ],
  },
  {
    label: 'Patrimônio', icon: Package,
    children: [
      { to: '/patrimonio', label: 'Cadastro de Bens' },
      { to: '/patrimonio/movimentacao', label: 'Movimentação' },
      { to: '/patrimonio/baixa', label: 'Baixa de Patrimônio' },
      { to: '/patrimonio/relatorios', label: 'Relatórios' },
      { to: '/patrimonio/configuracoes', label: 'Configurações' },
    ],
  },
  {
    label: 'Contabilidade', icon: Landmark,
    children: [
      { to: '/contabilidade/fechamento', label: 'Fechamento Mensal' },
      { to: '/contabilidade/exportacao', label: 'Exportação Contábil' },
      { to: '/contabilidade/demonstracoes', label: 'Demonstrações' },
      { to: '/contabilidade/plano-de-contas', label: 'Plano de Contas' },
      { to: '/contabilidade/configuracoes', label: 'Configurações' },
    ],
  },
  {
    label: 'Suporte', icon: Headphones,
    children: [
      { to: '/suporte/chamados', label: 'Chamados' },
    ],
  },
]

const navAdmin: NavItem[] = [
  {
    label: 'Administração', icon: Building2,
    children: [
      { to: '/admin/igrejas', label: 'Cadastro de Igrejas' },
      { to: '/admin/assinatura', label: 'Assinatura' },
      { to: '/admin/aparencia', label: 'Aparência' },
      { to: '/admin/integracoes', label: 'Integrações' },
      { to: '/admin/backup', label: 'Backup' },
      

    ],
  },
]

const ADMIN_ROLES = ['ROOT', 'ADMIN']

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { church, user, setUser, setChurch } = useApp()
  const navigate = useNavigate()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const isAdmin = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false
  const allNav = isAdmin ? [...navPrincipal, ...navAdmin] : navPrincipal

  function toggleGroup(label: string) {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('saved_email')
    setUser(null)
    setChurch(null)
    navigate('/login')
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-brand-900/50 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-50 h-screen bg-brand-800 text-white flex flex-col transition-all duration-200 shrink-0',
        collapsed ? 'lg:w-[84px]' : 'lg:w-[248px]',
        'w-[260px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-[68px] shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <Cloud className="h-4 w-4 text-brand-800" fill="currentColor" />
            </div>
            {!collapsed && <span className="font-extrabold text-lg tracking-tight whitespace-nowrap">IgrejaHub</span>}
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-none">
          {allNav.map((item) => {
            if (item.to) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </NavLink>
              )
            }

            const isOpen = openGroups.includes(item.label)
            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center',
                    isOpen && !collapsed && 'text-white bg-white/10',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                      {isOpen
                        ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      }
                    </>
                  )}
                </button>
                {isOpen && !collapsed && item.children && (
                  <div className="ml-3 pl-3 border-l border-white/15 mt-0.5 space-y-0.5">
                    {item.children.map(child => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={onCloseMobile}
                        className={({ isActive }) => cn(
                          'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10',
                        )}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Recolher */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs font-medium"
        >
          {collapsed
            ? <ChevronsRight className="h-4 w-4 mx-auto" />
            : <><ChevronsLeft className="h-4 w-4" /> Recolher menu</>
          }
        </button>

        {/* Rodapé */}
        <div className="p-3 border-t border-white/10 space-y-3">
          {!collapsed && (
            <div className="bg-white/10 rounded-xl px-3.5 py-3">
              <p className="text-sm font-semibold truncate">{church?.name ?? '—'}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-white/60">{user?.organizationName ?? ''}</span>
                <span className="text-[10px] font-bold bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded">Ativo</span>
              </div>
            </div>
          )}
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1E3A5F&color=fff`}
              alt={user?.name || 'Usuário'}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-white/50 truncate">{user?.email || ''}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sair"
              className="text-white/50 hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}