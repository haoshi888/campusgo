import type { LucideIcon } from 'lucide-react'
import { PackageOpen } from 'lucide-react'
import { Button } from '../ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center">
      <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <div className="absolute -right-1 -top-1 size-4 rounded-full bg-mint-300" />
        <Icon className="size-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
