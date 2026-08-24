import { ReactNode, useState, useEffect, useRef } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Extras'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { notificationsService, type Notification } from '@/services/notifications.service'

interface HeaderProps {
  crumbs: { label: string; to?: string }[]
  title: string
  searchPlaceholder?: string
  action?: { label: string; icon?: ReactNode; onClick?: () => void }
  onOpenMobile: () => void
}

export function Header({ crumbs, title, searchPlaceholder = 'Buscar no painel...', action, onOpenMobile }: HeaderProps) {
  const navigate = useNavigate()
  const [openNotif, setOpenNotif] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Buscar contagem de não lidas a cada 30s
  useEffect(() => {
    loadCount()
    const interval = setInterval(loadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenNotif(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function loadCount() {
    try {
      const count = await notificationsService.unreadCount()
      setUnread(count)
    } catch {}
  }

  async function handleOpenNotif() {
    const next = !openNotif
    setOpenNotif(next)
    if (next) {
      setLoading(true)
      try {
        const list = await notificationsService.list()
        setNotifications(list)
        // Marcar como lidas após abrir
        if (list.some(n => !n.read)) {
          await notificationsService.markAllRead()
          setUnread(0)
        }
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
  }

  function handleNotifClick(n: Notification) {
    setOpenNotif(false)
    if (n.link) navigate(n.link)
  }

  const TYPE_COLOR: Record<string, string> = {
    SUPPORT: 'bg-orange-100 text-orange-700',
    INFO: 'bg-blue-100 text-blue-700',
    SUCCESS: 'bg-green-100 text-green-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
  }

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

        {/* Sino de notificações — dados reais */}
        <div className="relative" ref={ref}>
          <button
            onClick={handleOpenNotif}
            className="relative h-10 w-10 rounded-lg border border-brand-100 bg-white flex items-center justify-center text-brand-700 hover:bg-brand-50 shrink-0"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-soft border border-brand-100 z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-brand-100 flex items-center justify-between">
                <p className="font-bold text-sm text-brand-900">Notificações</p>
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={async () => {
                      await notificationsService.markAllRead()
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                      setUnread(0)
                    }}
                    className="text-xs text-brand-400 hover:text-brand-700"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="py-8 text-center text-brand-300 text-sm">Carregando...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-brand-300 text-sm">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-brand-100" />
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-brand-50 last:border-0 hover:bg-brand-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${TYPE_COLOR[n.type] || TYPE_COLOR['INFO']}`}>
                          {n.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-brand-900' : 'text-brand-700'}`}>
                              {n.title}
                            </p>
                            {!n.read && <span className="h-2 w-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                          </div>
                          {n.body && <p className="text-xs text-brand-400 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-brand-300 mt-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR') : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
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