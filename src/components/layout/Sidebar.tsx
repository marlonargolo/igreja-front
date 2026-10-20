import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Wallet, Package, Landmark, BookUser, Settings,
  ChevronsLeft, ChevronsRight, X, Cloud, ChevronDown, ChevronRight,
  Building2, CreditCard, Palette, Plug, HardDrive, LogOut, ArrowLeftCircle,
} from 'lucide-react'
import { cn } from '@/lib/format'
import { Headphones } from 'lucide-react'
import { useApp } from '@/lib/AppContext'

interface NavItem {
  to?: string
  label: string
  icon: React.ElementType
  children?: { to: string; label: string }[]
  /** Permissão "representativa" do módulo (ou uma lista — basta ter uma
   *  delas) — controla se o grupo aparece no menu, refletindo o que foi
   *  marcado em "Gerenciar Permissões". Omitida = sempre visível (ex.:
   *  Dashboard). ROOT sempre vê tudo. */
  permission?: string | string[]
  /** Chave do catálogo de módulos (Admin Externa → Módulos). Quando
   *  presente, o grupo só aparece se esse módulo estiver habilitado pra
   *  Igreja do usuário — além de precisar da permissão acima. Omitida =
   *  não é um módulo opcional (ex.: Dashboard, Configurações). ROOT
   *  sempre vê tudo. */
  moduleKey?: string
}

const navPrincipal: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  {
    // Grupo mistura páginas de categorias USERS (Usuários) e SETTINGS
    // (Congregações) — basta ter visão de uma das duas para o grupo aparecer.
    label: 'Configurações', icon: Settings, permission: ['USER_VIEW', 'SETTINGS_VIEW'],
    children: [
      { to: '/configuracoes/congregacoes', label: 'Congregações' },
      { to: '/usuarios', label: 'Usuários' },
    ],
  },
  {
    label: 'Secretaria', icon: BookUser, permission: 'MEMBER_VIEW', moduleKey: 'SECRETARIA',
    children: [
      { to: '/membros', label: 'Membros' },
      { to: '/secretaria/transferencias', label: 'Transferências' },
      { to: '/secretaria/credenciais', label: 'Credenciais' },
      { to: '/secretaria/relatorios', label: 'Relatórios' },
      { to: '/secretaria/documentos', label: 'Documentos' },
      { to: '/secretaria/configuracoes', label: 'Configurações' },
    ],
  },
  {
    label: 'Tesouraria', icon: Wallet, permission: 'FINANCE_VIEW', moduleKey: 'TESOURARIA',
    children: [
      { to: '/tesouraria/receitas', label: 'Receitas' },
      { to: '/tesouraria/despesas', label: 'Despesas' },
      { to: '/tesouraria/transferencias', label: 'Transferências' },
      { to: '/tesouraria/relatorios', label: 'Relatórios' },
      { to: '/tesouraria/configuracoes', label: 'Fornecedores' },
    ],
  },
  {
    label: 'Patrimônio', icon: Package, permission: 'ASSET_VIEW', moduleKey: 'PATRIMONIO',
    children: [
      { to: '/patrimonio', label: 'Cadastro de Bens' },
      { to: '/patrimonio/movimentacao', label: 'Movimentação' },
      { to: '/patrimonio/baixa', label: 'Baixa de Patrimônio' },
      { to: '/patrimonio/relatorios', label: 'Relatórios' },
      { to: '/patrimonio/configuracoes', label: 'Configurações' },
    ],
  },
  {
    label: 'Suporte', icon: Headphones, permission: 'SUPPORT_VIEW', moduleKey: 'SUPORTE',
    children: [
      { to: '/suporte/chamados', label: 'Chamados' },
    ],
  },
]

// Administração desta Igreja apenas — a Administração Externa (global, todas
// as Igrejas) nunca aparece aqui; ela é acessada exclusivamente pela tela de
// seleção de Igrejas, através do botão exclusivo do ROOT. Só aparece pra
// isAdmin (ROOT/ADMIN).
const navAdmin: NavItem[] = [
  {
    label: 'Administração', icon: Building2,
    children: [
      { to: '/admin/assinatura', label: 'Assinatura' },
      { to: '/admin/aparencia', label: 'Aparência' },
      { to: '/admin/integracoes', label: 'Integrações' },
      { to: '/admin/backup', label: 'Backup' },
    ],
  },
]

// Contabilidade saiu do bloco de módulos operacionais (Secretaria/Tesouraria/
// Patrimônio) e passou a aparecer junto do painel administrativo — mas,
// diferente de "Administração" acima, continua liberada por ACCOUNTING_VIEW
// (não por isAdmin): um TESOUREIRO sem a role ADMIN também tem essa
// permissão por padrão e não pode perder o acesso ao mudar de lugar no menu.
const navContabilidade: NavItem = {
  label: 'Contabilidade', icon: Landmark, permission: 'ACCOUNTING_VIEW', moduleKey: 'CONTABILIDADE',
  children: [
    { to: '/contabilidade/fechamento', label: 'Fechamento Mensal' },
    { to: '/contabilidade/exportacao', label: 'Exportação Contábil' },
    { to: '/contabilidade/demonstracoes', label: 'Demonstrações' },
    { to: '/contabilidade/plano-de-contas', label: 'Plano de Contas' },
    { to: '/contabilidade/configuracoes', label: 'Configurações' },
  ],
}

const ADMIN_ROLES = ['ROOT', 'ADMIN']

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { church, congregation, isCongregationEntered, exitCongregation, user, setUser, setChurch, hasPermission, isRoot } = useApp()
  const navigate = useNavigate()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const isAdmin = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false

  function canViewGroup(item: NavItem): boolean {
    if (isRoot) return true
    if (item.permission) {
      const perms = Array.isArray(item.permission) ? item.permission : [item.permission]
      if (!perms.some(p => hasPermission(p))) return false
    }
    // Módulo explicitamente desabilitado pro Admin Externa pra essa Igreja
    // (lista ausente = sem restrição, preserva o comportamento de quem já existe).
    if (item.moduleKey && user?.enabledModules && !user.enabledModules.includes(item.moduleKey)) {
      return false
    }
    return true
  }

  const principalFiltered = navPrincipal.filter(canViewGroup)
  const adminFiltered = navAdmin.filter(canViewGroup)
  const contabilidadeVisible = canViewGroup(navContabilidade) ? [navContabilidade] : []
  const allNav = isAdmin
    ? [...principalFiltered, ...adminFiltered, ...contabilidadeVisible]
    : [...principalFiltered, ...contabilidadeVisible]

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

  function handleExitCongregation() {
    exitCongregation()
    navigate('/dashboard')
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
            {!collapsed && <span className="font-extrabold text-lg tracking-tight whitespace-nowrap">NEXO</span>}
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
              <p className="text-sm font-semibold truncate">
                {congregation?.name ?? church?.name ?? '—'}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-white/60 truncate">
                  {congregation ? (congregation.churchName || church?.name || '') : (user?.organizationName ?? '')}
                </span>
                <span className="text-[10px] font-bold bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded shrink-0 ml-2">Ativo</span>
              </div>
              {isCongregationEntered && (
                <button
                  onClick={handleExitCongregation}
                  className="mt-2 w-full flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white"
                  title="Voltar para a visão da Igreja inteira"
                >
                  <ArrowLeftCircle className="h-3.5 w-3.5 shrink-0" />
                  Sair da Congregação
                </button>
              )}
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