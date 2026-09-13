import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastTone = 'success' | 'error' | 'info'

interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
}

interface ToastItem extends ToastInput {
  id: number
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneMeta = {
  success: { icon: CheckCircle2, className: 'border-mint-200 bg-white', iconClass: 'text-emerald-600' },
  error: { icon: TriangleAlert, className: 'border-rose-200 bg-white', iconClass: 'text-rose-500' },
  info: { icon: Info, className: 'border-violet-200 bg-white', iconClass: 'text-violet-600' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random()
    setToasts((items) => [...items, { ...input, id, tone: input.tone || 'info' }])
    window.setTimeout(() => dismiss(id), 3600)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
        {toasts.map((item) => {
          const meta = toneMeta[item.tone || 'info']
          const Icon = meta.icon
          return (
            <div key={item.id} className={cn('pointer-events-auto flex animate-pop-in items-start gap-3 rounded-2xl border p-3.5 shadow-float', meta.className)} role="status">
              <Icon className={cn('mt-0.5 size-5 shrink-0', meta.iconClass)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>}
              </div>
              <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => dismiss(item.id)} aria-label="关闭提示">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
