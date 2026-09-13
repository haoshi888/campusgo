import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]',
  {
    variants: {
      variant: {
        default: 'bg-violet-600 text-white shadow-[0_8px_20px_rgba(94,70,240,.25)] hover:bg-violet-700',
        secondary: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
        outline: 'border border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600',
        mint: 'bg-mint-300 text-emerald-950 shadow-[0_8px_20px_rgba(23,199,125,.2)] hover:bg-mint-400',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-13 rounded-2xl px-7 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
