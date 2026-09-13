import { Heart, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { Product } from '../../types'
import { api } from '../../lib/api'
import { track } from '../../lib/analytics'
import { cn, formatDistance, formatPrice, formatRelativeTime } from '../../lib/utils'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/button'
import { StatusBadge } from './ProductBits'

interface ProductCardProps {
  product: Product
  className?: string
  compact?: boolean
  onFavoriteChange?: (productId: string, favorite: boolean) => void
}

export function ProductCard({ product, className, compact = false, onFavoriteChange }: ProductCardProps) {
  const [favorite, setFavorite] = useState(product.isFavorite)
  const [favoriteCount, setFavoriteCount] = useState(product.favoriteCount)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const { toast } = useToast()

  const toggleFavorite = async () => {
    if (favoriteLoading) return
    setFavoriteLoading(true)
    try {
      const response = await api.post<{ favorite: boolean; message: string }>(`/favorites/${product.id}`)
      setFavorite(response.favorite)
      setFavoriteCount((count) => Math.max(0, count + (response.favorite ? 1 : -1)))
      onFavoriteChange?.(product.id, response.favorite)
      toast({ title: response.message, tone: 'success' })
      if (response.favorite) void track('favorite_product', { productId: product.id })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '收藏失败', tone: 'error' })
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <article
      data-product-id={product.id}
      className={cn('group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_45px_rgba(61,47,126,.13)]', className)}
    >
      <Link
        to={`/product/${product.id}`}
        className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        onClick={() => void track('click_product', { productId: product.id, metadata: { source: 'product_card' } })}
      >
        <div className={cn('relative overflow-hidden bg-slate-100', compact ? 'aspect-[1.45]' : 'aspect-[4/3]')}>
          <img
            src={product.images[0] || '/assets/products/backpack.svg'}
            alt={product.title}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.035]"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.school === '江城大学' && <StatusBadge status={product.status} className="bg-white/90 backdrop-blur" />}
            {product.school !== '江城大学' && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 backdrop-blur">邻校好物</span>}
          </div>
        </div>
        <div className={cn('p-3.5 sm:p-4', compact && 'p-3')}>
          <h3 className={cn('line-clamp-2 min-h-11 text-[15px] font-bold leading-6 text-slate-900', compact && 'min-h-10 text-sm leading-5')}>{product.title}</h3>
          <div className="mt-2 flex items-end justify-between gap-2">
            <span className="font-black tracking-[-0.04em] text-coral-500">
              <span className="mr-0.5 text-[0.68em]">¥</span>{formatPrice(product.price)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <MapPin className="size-3.5 text-violet-500" />{formatDistance(product.distanceM)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{product.seller.nickname} · {product.seller.school}</span>
            </span>
            <span className="shrink-0">{formatRelativeTime(product.createdAt)}</span>
          </div>
        </div>
      </Link>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-3 top-3 size-9 rounded-full border-white/80 bg-white/90 text-slate-500 shadow-sm backdrop-blur hover:bg-white hover:text-coral-500"
        onClick={toggleFavorite}
        aria-label={favorite ? '取消收藏' : '收藏商品'}
        disabled={favoriteLoading}
      >
        <Heart className={cn('size-4', favorite && 'fill-coral-500 text-coral-500')} />
        <span className="sr-only">{favoriteCount}</span>
      </Button>
    </article>
  )
}
