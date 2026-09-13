import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.12em] text-violet-500">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </header>
  )
}
