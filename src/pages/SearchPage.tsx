import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowDownUp, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { cn } from '../lib/utils'
import type { Product } from '../types'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/form'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { ProductGrid, ProductSkeletonGrid } from '../components/product/ProductGrid'
import { useProductExposure } from '../hooks/useProductExposure'

const categories = ['全部', '教材', '数码', '宿舍用品', '家具', '运动用品', '其他']

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [keyword, setKeyword] = useState(query)
  const [category, setCategory] = useState('全部')
  const [price, setPrice] = useState('0')
  const [distance, setDistance] = useState('0')
  const [sort, setSort] = useState('recommended')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const productIds = useMemo(() => products.map((product) => product.id), [products])

  useEffect(() => {
    setKeyword(query)
  }, [query])

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<{ products: Product[] }>('/products', { q: query, category, maxPrice: price, maxDistance: distance, sort })
      .then((response) => { if (active) setProducts(response.products) })
      .catch(() => { if (active) setProducts([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, category, price, distance, sort])

  useProductExposure(gridRef, productIds, !loading)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (keyword.trim()) next.set('q', keyword.trim())
    else next.delete('q')
    setSearchParams(next)
  }

  const resetFilters = () => {
    setCategory('全部')
    setPrice('0')
    setDistance('0')
    setSort('recommended')
    setKeyword('')
    setSearchParams({})
  }

  const hasFilters = Boolean(query || category !== '全部' || price !== '0' || distance !== '0' || sort !== 'recommended')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="全校园搜索"
        title={query ? `“${query}”的搜索结果` : '搜索校园闲置'}
        description="推荐排序会优先展示同校、距离近的商品，同时兼顾发布时间。"
      />

      <form onSubmit={submit} className="flex items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
        <Search className="ml-3 size-5 shrink-0 text-slate-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
          placeholder="搜索教材、数码、宿舍用品..."
          autoFocus
        />
        {keyword && <button type="button" onClick={() => setKeyword('')} className="mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>}
        <Button className="h-11 rounded-xl">搜索</Button>
      </form>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <SlidersHorizontal className="size-4 text-violet-600" />筛选与排序
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              className={cn(
                'h-9 shrink-0 rounded-xl px-3.5 text-xs font-semibold transition',
                category === item ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <Select value={price} onChange={(event) => setPrice(event.target.value)} className="h-10 text-xs" aria-label="价格">
            <option value="0">价格不限</option>
            <option value="50">50 元内</option>
            <option value="100">100 元内</option>
            <option value="300">300 元内</option>
            <option value="1000">1000 元内</option>
          </Select>
          <Select value={distance} onChange={(event) => setDistance(event.target.value)} className="h-10 text-xs" aria-label="距离">
            <option value="0">距离不限</option>
            <option value="100">100m 内</option>
            <option value="300">300m 内</option>
            <option value="500">500m 内</option>
            <option value="1000">1km 内</option>
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 text-xs" aria-label="排序">
            <option value="recommended">优先推荐</option>
            <option value="newest">最新发布</option>
            <option value="distance">距离最近</option>
            <option value="price_asc">价格升序</option>
            <option value="price_desc">价格降序</option>
          </Select>
        </div>
      </section>

      <section ref={gridRef}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowDownUp className="size-4 text-violet-500" />
            找到 <strong className="text-slate-900">{products.length}</strong> 件商品
          </div>
          {hasFilters && <button onClick={resetFilters} className="text-xs font-semibold text-violet-600 hover:text-violet-800">清除筛选</button>}
        </div>
        {loading ? (
          <ProductSkeletonGrid />
        ) : products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={MapPin}
            title="没有找到匹配的闲置"
            description="尝试减少筛选条件，或者用更短的关键词搜索。校园里可能还有商品等待发布。"
            actionLabel="清除筛选"
            onAction={resetFilters}
          />
        )}
      </section>
    </div>
  )
}
