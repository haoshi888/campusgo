import type { Product } from '../../types'
import { Skeleton } from '../ui/form'
import { cn } from '../../lib/utils'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products, className, compact = false }: { products: Product[]; className?: string; compact?: boolean }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {products.map((product) => <ProductCard key={product.id} product={product} compact={compact} />)}
    </div>
  )
}

export function ProductSkeletonGrid({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-0">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
