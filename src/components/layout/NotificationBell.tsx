// src/components/layout/NotificationBell.tsx
import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationsService, type Notification } from '@/services/notifications.service'

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Polling a cada 30s
  useEffect(() => {
    loadCount()
    const interval = setInterval(loadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadCount() {
    try {
      const count = await notificationsService.unreadCount()
      setUnread(count)
    } catch {}
  }

  async function handleOpen() {
    setOpen(v => !v)
    if (!open) {
      setLoading(true)
      try {
        const list = await notificationsService.list()
        setNotifications(list)
        setUnread(0)
        // Marcar como lidas
        await notificationsService.markAllRead()
      } catch {}
      setLoading(false)
    }
  }

  function handleNotifClick(n: Notification) {
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const TYPE_COLOR: Record<string, string> = {
    SUPPORT: 'bg-orange-100 text-orange-700',
    INFO: 'bg-blue-100 text-blue-700',
    SUCCESS: 'bg-green-100 text-green-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-brand-500 hover:text-brand-900 hover:bg-brand-50 transition-colors"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-soft border border-brand-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-100 flex items-center justify-between">
            <p className="font-bold text-brand-900 text-sm">Notificações</p>
            <button
              onClick={async () => { await notificationsService.markAllRead(); setNotifications(n => n.map(x => ({ ...x, read: true }))); setUnread(0) }}
              className="text-xs text-brand-500 hover:text-brand-800"
            >
              Marcar todas como lidas
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-brand-300 text-sm">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-brand-300 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 text-brand-200" />
                Nenhuma notificação
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-brand-50 hover:bg-brand-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${TYPE_COLOR[n.type] || TYPE_COLOR['INFO']}`}>
                      {n.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-brand-900' : 'text-brand-700'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-brand-400 mt-0.5 truncate">{n.body}</p>}
                      <p className="text-xs text-brand-300 mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                    {!n.read && <span className="h-2 w-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}