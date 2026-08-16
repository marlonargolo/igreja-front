import { cn } from '@/lib/format'

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-6 border-b border-brand-100 overflow-x-auto scrollbar-none', className)}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'relative pb-3 text-sm font-semibold whitespace-nowrap transition-colors',
            active === tab ? 'text-brand-800' : 'text-brand-300 hover:text-brand-700',
          )}
        >
          {tab}
          {active === tab && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-800 rounded-full" />}
        </button>
      ))}
    </div>
  )
}
