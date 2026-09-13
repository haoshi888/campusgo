import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none', {
  variants: {
    variant: {
      default: 'border-violet-200 bg-violet-50 text-violet-700',
      mint: 'border-mint-200 bg-mint-50 text-emerald-700',
      coral: 'border-rose-200 bg-rose-50 text-rose-600',
      amber: 'border-amber-200 bg-amber-50 text-amber-700',
      slate: 'border-slate-200 bg-slate-50 text-slate-600',
      solid: 'border-violet-600 bg-violet-600 text-white',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
