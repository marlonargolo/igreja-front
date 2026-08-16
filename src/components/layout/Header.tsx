import { ReactNode, useState } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Extras'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  crumbs: { label: string; to?: string }[]
  title: string
  searchPlaceholder?: string
  action?: { label: string; icon?: ReactNode; onClick?: () => void }
  onOpenMobile: () => void
}

const notifications = [
  { title: 'Novo membro cadastrado', desc: 'Mariana Costa Lima se cadastrou como visitante.', time: '5 min' },
  { title: 'Despesa pendente', desc: 'Fatura de energia elétrica aguardando confirmação.', time: '2h' },
  { title: 'Relatório gerado', desc: 'Relatório financeiro anual está pronto para download.', time: '1d' },
]

export function Header({ crumbs, title, searchPlaceholder = 'Buscar no painel...', action, onOpenMobile }: HeaderProps) {
  const [openNotif, setOpenNotif] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-brand-50/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-brand-100/70">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onOpenMobile} className="lg:hidden text-brand-700 shrink-0">
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <Breadcrumb items={crumbs} />
          <h1 className="text-[22px] font-extrabold text-brand-900 truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
          <input
            placeholder={searchPlaceholder}
            className="pl-9 pr-4 py-2.5 rounded-lg border border-brand-100 bg-white text-sm w-64 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-brand-300"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenNotif((v) => !v)}
            className="relative h-10 w-10 rounded-lg border border-brand-100 bg-white flex items-center justify-center text-brand-700 hover:bg-brand-50 shrink-0"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          {openNotif && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenNotif(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-soft border border-brand-100 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-brand-100 font-bold text-sm text-brand-900">Notificações</div>
                {notifications.map((n, i) => (
                  <div key={i} className="px-4 py-3 border-b border-brand-100 last:border-0 hover:bg-brand-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-900">{n.title}</p>
                      <span className="text-[11px] text-brand-300">{n.time}</span>
                    </div>
                    <p className="text-xs text-brand-300 mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {action && (
          <Button onClick={action.onClick} className="shrink-0">
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    </header>
  )
}
