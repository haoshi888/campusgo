import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function CampusLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5', className)} aria-label="CampusGo 首页">
      <img src="/assets/logo-mark.svg" alt="" className="size-9 rounded-xl shadow-[0_8px_18px_rgba(94,70,240,.24)]" />
      {!compact && (
        <div className="leading-none">
          <span className="block font-display text-[19px] font-black tracking-[-0.04em] text-slate-950">CampusGo</span>
          <span className="mt-1 block text-[10px] font-semibold tracking-[0.08em] text-violet-500">NEARBY & TRUSTED</span>
        </div>
      )}
    </Link>
  )
}
