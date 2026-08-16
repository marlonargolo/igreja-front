import { HTMLAttributes } from 'react'
import { cn } from '@/lib/format'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange' | 'navy'
}

const tones: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-sky-100 text-sky-700',
  gray: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  navy: 'bg-brand-800 text-white',
}

export function Badge({ className, tone = 'gray', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
