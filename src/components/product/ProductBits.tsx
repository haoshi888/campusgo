import { Clock3, MapPin } from 'lucide-react'
import type { Product } from '../../types'
import { formatDistance, formatPrice, formatRelativeTime, STATUS_META } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

export function StatusBadge({ status, className }: { status: Product['status']; className?: string }) {
  const meta = STATUS_META[status]
  return <Badge className={cn(meta.className, className)}>{meta.label}</Badge>
}

export function ProductMeta({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 text-xs text-slate-500', compact && 'gap-2')}>
      <span className="inline-flex min-w-0 items-center gap-1">
        <MapPin className="size-3.5 shrink-0 text-violet-500" />
        <span className="truncate">{formatDistance(product.distanceM)} · {product.tradePlace}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1">
        <Clock3 className="size-3.5" />
        {formatRelativeTime(product.createdAt)}
      </span>
    </div>
  )
}

export function Price({ value, original, size = 'default' }: { value: number; original?: number; size?: 'default' | 'large' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn('font-black tracking-[-0.04em] text-coral-500', size === 'large' ? 'text-3xl' : 'text-xl')}>
        <span className="mr-0.5 text-[0.65em]">¥</span>{formatPrice(value)}
      </span>
      {original && original > value && <span className="text-xs text-slate-400 line-through">¥{formatPrice(original)}</span>}
    </div>
  )
}
