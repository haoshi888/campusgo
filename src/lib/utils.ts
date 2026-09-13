import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
}

export function formatDistance(value: number) {
  if (value < 1000) return `${value}m`
  return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}km`
}

export function formatRelativeTime(value: string) {
  const time = new Date(value).getTime()
  const diff = Date.now() - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < day * 7) return `${Math.floor(diff / day)}天前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const STATUS_META = {
  available: { label: '出售中', className: 'bg-mint-100 text-emerald-700 border-mint-200' },
  reserved: { label: '已预订', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: '已完成', className: 'bg-slate-100 text-slate-500 border-slate-200' },
} as const
