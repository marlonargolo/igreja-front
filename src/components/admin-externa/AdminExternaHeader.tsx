// src/components/admin-externa/AdminExternaHeader.tsx
import { ReactNode, useEffect, useState } from 'react'
import { Menu, Globe2, Building2 } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { adminService, type AdminStats } from '@/services/admin.service'

interface Props {
  crumbs: { label: string; to?: string }[]
  title: string
  action?: ReactNode
  onOpenMobile: () => void
}

export function AdminExternaHeader({ crumbs, title, action, onOpenMobile }: Props) {
  const { user } = useApp()
  const { mode, scopeChurchId, scopeChurch, churches, loadingChurches, setScope } = useAdminExterna()
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      const s = await adminService.stats()
      if (alive) setStats(s)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { alive = false; clearInterval(interval) }
  }, [scopeChurchId])

  return (
    <div className="sticky top-0 z-30 bg-slate-950 border-b border-amber-500/10">
      <header className="px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onOpenMobile} className="lg:hidden text-white/70 shrink-0">
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <Breadcrumb items={[{ label: 'Administração Externa' }, ...crumbs]} />
            <h1 className="text-[22px] font-extrabold text-white truncate">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-white">{user?.name}</span>
            <span className="text-xs text-slate-400">{user?.organizationName || 'Organização'}</span>
          </div>

          {/* Seletor global de igreja */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pl-3 pr-2 py-2">
              {mode === 'global'
                ? <Globe2 className="h-4 w-4 text-amber-400 shrink-0" />
                : <Building2 className="h-4 w-4 text-amber-400 shrink-0" />}
              <select
                value={scopeChurchId ?? ''}
                disabled={loadingChurches}
                onChange={e => setScope(e.target.value || null)}
                className="bg-transparent text-sm text-white outline-none max-w-[180px] sm:max-w-[240px] disabled:opacity-50"
              >
                <option value="" className="text-slate-900">Modo Global (todas as Igrejas)</option>
                {churches.map(c => (
                  <option key={c.id} value={String(c.id)} className="text-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {action}
        </div>
      </header>

      {/* Painel de status — indicadores em tempo real */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 flex flex-wrap gap-2">
        <StatusPill label={mode === 'global' ? 'Escopo' : 'Igreja'} value={mode === 'global' ? 'Global' : (scopeChurch?.name ?? '—')} />
        <StatusPill label="Igrejas ativas" value={stats ? String(stats.churches) : '—'} />
        <StatusPill label="Congregações" value={stats ? String(stats.congregations) : '—'} />
        <StatusPill label="Usuários" value={stats ? String(stats.users) : '—'} />
        <StatusPill label="Membros" value={stats ? String(stats.members) : '—'} />
        {stats?.documents !== undefined && <StatusPill label="Documentos" value={String(stats.documents)} />}
        {stats?.supportTicketsOpen !== undefined && <StatusPill label="Chamados abertos" value={String(stats.supportTicketsOpen)} />}
      </div>
    </div>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <span className="text-xs font-bold text-amber-300">{value}</span>
    </div>
  )
}
