import { ReactNode } from 'react'
import { ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/lib/format'

export function MetricCard({
  label, value, icon, trend, trendUp = true, iconBg = 'bg-brand-100 text-brand-800',
}: {
  label: string
  value: string
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  iconBg?: string
}) {
  return (
    <Card className="p-5 flex flex-col gap-3 min-w-[180px]">
      <div className="flex items-start justify-between">
        <span className="text-sm text-brand-300 font-medium">{label}</span>
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>{icon}</div>
      </div>
      <div className="text-2xl font-extrabold text-brand-900 leading-tight">{value}</div>
      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-semibold', trendUp ? 'text-green-600' : 'text-red-500')}>
          {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {trend}
        </div>
      )}
    </Card>
  )
}

export function EmptyState({ title = 'Nenhum resultado encontrado', description = 'Tente ajustar os filtros ou realizar uma nova busca.' }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="h-14 w-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
        <Inbox className="h-6 w-6 text-brand-300" />
      </div>
      <h4 className="text-sm font-bold text-brand-900">{title}</h4>
      <p className="text-sm text-brand-300 mt-1 max-w-xs">{description}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-brand-100/70', className)} />
}

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === total || Math.abs(p - page) <= 1,
  )
  let last = 0
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 text-xs font-semibold rounded-md border border-brand-100 text-brand-700 hover:bg-brand-50 disabled:opacity-40"
      >
        Anterior
      </button>
      {pages.map((p) => {
        const gap = p - last > 1
        last = p
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="text-brand-300 text-xs px-1">...</span>}
            <button
              onClick={() => onChange(p)}
              className={cn(
                'h-8 w-8 text-xs font-semibold rounded-md border',
                p === page ? 'bg-brand-800 text-white border-brand-800' : 'border-brand-100 text-brand-700 hover:bg-brand-50',
              )}
            >
              {p}
            </button>
          </span>
        )
      })}
      <button
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page === total}
        className="px-3 py-1.5 text-xs font-semibold rounded-md border border-brand-100 text-brand-700 hover:bg-brand-50 disabled:opacity-40"
      >
        Próximo
      </button>
    </div>
  )
}
