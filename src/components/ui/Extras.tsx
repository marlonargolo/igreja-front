import { createContext, ReactNode, useCallback, useContext, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Avatar({ src, alt, size = 36 }: { src: string; alt: string; size?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0 bg-brand-100"
    />
  )
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-brand-300 mb-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-700">{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-brand-700 font-medium' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

// Toast system
interface Toast { id: number; message: string }
const ToastContext = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string) => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 bg-brand-900 text-white text-sm font-medium pl-3 pr-4 py-3 rounded-xl shadow-soft animate-[fadeIn_.2s_ease-out]">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            {t.message}
            <button onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))} className="ml-1 text-white/50 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
