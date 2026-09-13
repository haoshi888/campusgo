import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Bike, BookOpen, Box, ChevronRight, Lamp, MapPin, Navigation, Package, Search, ShieldCheck, Sparkles, Smartphone, Armchair } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { track } from '../lib/analytics'
import { cn, formatDistance } from '../lib/utils'
import type { Product } from '../types'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/form'
import { EmptyState } from '../components/common/EmptyState'
import { ProductGrid, ProductSkeletonGrid } from '../components/product/ProductGrid'
import { useProductExposure } from '../hooks/useProductExposure'

const categories = [
  { label: '全部', icon: Sparkles },
  { label: '教材', icon: BookOpen },
  { label: '数码', icon: Smartphone },
  { label: '宿舍用品', icon: Lamp },
  { label: '家具', icon: Armchair },
  { label: '运动用品', icon: Bike },
  { label: '其他', icon: Package },
]

export function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('全部')
  const [distance, setDistance] = useState('0')
  const [price, setPrice] = useState('0')
  const [sort, setSort] = useState('recommended')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const productIds = useMemo(() => products.map((product) => product.id), [products])

  useEffect(() => {
    void track('view_home', { onceKey: 'view-home-session' })
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<{ products: Product[] }>('/products', { category, maxDistance: distance, maxPrice: price, sort })
      .then((response) => { if (active) setProducts(response.products) })
      .catch(() => { if (active) setProducts([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category, distance, price, sort])

  useProductExposure(gridRef, productIds, !loading)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    navigate(`/search?${params.toString()}`)
  }

  const nearest = products.length ? Math.min(...products.map((product) => product.distanceM)) : 180
  const sameSchoolCount = products.filter((product) => product.school === '江城大学' && product.status === 'available').length

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[30px] bg-slate-950 px-5 py-7 text-white shadow-[0_24px_70px_rgba(26,27,58,.2)] sm:px-8 sm:py-9 lg:px-10 lg:py-11">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-violet-500/35 blur-3xl" />
        <div className="absolute bottom-0 right-[22%] size-48 rounded-full bg-mint-400/20 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100 backdrop-blur">
              <ShieldCheck className="size-3.5 text-mint-300" />
              同校认证 · 校园内交易 · 平均 {formatDistance(nearest)} 可达
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-[34px] font-black leading-[1.1] tracking-[-0.055em] sm:text-5xl lg:text-[56px]">
              把闲置，交给
              <span className="relative ml-1 inline-block text-mint-300">
                隔壁楼
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-mint-300/45" />
              </span>
              。
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              从宿舍到教学楼，找到真正离你近、身份可信的校园二手好物。今天已有 {sameSchoolCount || 9} 件同校商品在等你。
            </p>

            <form onSubmit={submitSearch} className="mt-6 flex max-w-2xl items-center rounded-2xl border border-white/15 bg-white p-1.5 shadow-2xl">
              <Search className="ml-3 size-5 shrink-0 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="搜索教材、数码、宿舍用品..."
              />
              <Button type="submit" className="h-11 shrink-0 rounded-xl px-4">
                搜索
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-mint-300" />学生身份认证</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-violet-300" />500m 内优先推荐</span>
              <span className="inline-flex items-center gap-1.5"><Navigation className="size-4 text-sky-300" />支持校内面交</span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-300">今天离你最近</p>
                <p className="mt-1 text-lg font-bold">图书馆北门 · 80m</p>
              </div>
              <span className="rounded-full bg-mint-300 px-2.5 py-1 text-[11px] font-bold text-emerald-950">可面交</span>
            </div>
            <div className="relative mt-5 h-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)', backgroundSize: '18px 18px' }} />
              <div className="absolute left-5 top-6 flex size-10 items-center justify-center rounded-2xl bg-violet-500 shadow-lg">
                <MapPin className="size-5" />
              </div>
              <div className="absolute bottom-6 right-6 flex size-12 items-center justify-center rounded-2xl bg-mint-300 text-emerald-950 shadow-lg">
                <Package className="size-5" />
              </div>
              <svg className="absolute inset-0 size-full" viewBox="0 0 330 160" fill="none">
                <path d="M45 48 C112 48, 118 116, 282 116" stroke="#D9FFEB" strokeWidth="3" strokeDasharray="8 7" />
              </svg>
              <div className="absolute left-[25%] top-1/2 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-lg">骑行 1 分钟</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/10 px-2 py-2.5"><p className="text-lg font-black">128</p><p className="text-[10px] text-slate-400">本校在售</p></div>
              <div className="rounded-xl bg-white/10 px-2 py-2.5"><p className="text-lg font-black">380m</p><p className="text-[10px] text-slate-400">平均距离</p></div>
              <div className="rounded-xl bg-white/10 px-2 py-2.5"><p className="text-lg font-black">98%</p><p className="text-[10px] text-slate-400">好评率</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-card sm:p-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => {
            const Icon = item.icon
            const active = category === item.label
            return (
              <button
                key={item.label}
                onClick={() => setCategory(item.label)}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition',
                  active ? 'bg-violet-600 text-white shadow-[0_7px_18px_rgba(94,70,240,.22)]' : 'bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <Select aria-label="距离筛选" value={distance} onChange={(event) => setDistance(event.target.value)} className="h-10 text-xs">
            <option value="0">距离不限</option>
            <option value="300">300m 内</option>
            <option value="500">500m 内</option>
            <option value="1000">1km 内</option>
          </Select>
          <Select aria-label="价格筛选" value={price} onChange={(event) => setPrice(event.target.value)} className="h-10 text-xs">
            <option value="0">价格不限</option>
            <option value="50">50 元内</option>
            <option value="200">200 元内</option>
            <option value="500">500 元内</option>
            <option value="1000">1000 元内</option>
          </Select>
          <Select aria-label="排序方式" value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 text-xs">
            <option value="recommended">优先推荐</option>
            <option value="newest">最新发布</option>
            <option value="distance">距离最近</option>
            <option value="price_asc">价格从低到高</option>
          </Select>
        </div>
      </section>

      <section ref={gridRef}>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-black tracking-[-0.035em] text-slate-950 sm:text-2xl">刚刚离你最近</h2>
              <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">同校优先</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">已按校园身份、距离与发布时间综合排序</p>
          </div>
          <button onClick={() => navigate('/search')} className="hidden items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800 sm:flex">
            查看全部 <ChevronRight className="size-4" />
          </button>
        </div>

        {loading ? (
          <ProductSkeletonGrid />
        ) : products.length ? (
          <ProductGrid products={products.slice(0, 12)} />
        ) : (
          <EmptyState
            title="暂无附近商品"
            description="换个筛选条件，或者成为今天第一个发布闲置的人。"
            actionLabel="发布第一个闲置"
            onAction={() => navigate('/publish')}
            icon={Box}
          />
        )}
      </section>
    </div>
  )
}
