import { ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/utils'

export function VerifiedBadge({ school, compact = false, className }: { school?: string; compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-1 text-[11px] font-semibold text-emerald-700', className)}>
      <ShieldCheck className="size-3.5" />
      {compact ? '已认证' : `${school || '本校'}学生已认证`}
    </span>
  )
}
