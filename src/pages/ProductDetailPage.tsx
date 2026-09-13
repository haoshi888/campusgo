import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarClock, Check, ChevronRight, Heart, MapPin, MessageCircle, PackageCheck, ShieldCheck, Sparkles, Star, Store, TrendingDown } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { track } from '../lib/analytics'
import { cn, formatDateTime, formatDistance, formatPrice } from '../lib/utils'
import type { ChatSummary, Product } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Skeleton } from '../components/ui/form'
import { VerifiedBadge } from '../components/common/VerifiedBadge'
import { ProductGrid } from '../components/product/ProductGrid'
import { Price, StatusBadge } from '../components/product/ProductBits'

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [tradeLoading, setTradeLoading] = useState(false)
  const [tradeOpen, setTradeOpen] = useState(false)
  const [meetupConfirmed, setMeetupConfirmed] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<{ product: Product; related: Product[] }>(`/products/${id}`, { track: 1 })
      .then((response) => {
        if (!active) return
        setProduct(response.product)
        setRelated(response.related)
      })
      .catch((error) => {
        toast({ title: error instanceof Error ? error.message : '加载失败', tone: 'error' })
      })
      .finally(() => { if (active) setLoading(false) })
    void track('click_product', { productId: id, onceKey: `detail-click-${id}`, metadata: { source: 'detail' } })
    return () => { active = false }
  }, [id, toast])

  const toggleFavorite = async () => {
    if (!product) return
    try {
      const response = await api.post<{ favorite: boolean; message: string }>(`/favorites/${product.id}`)
      setProduct({ ...product, isFavorite: response.favorite, favoriteCount: Math.max(0, product.favoriteCount + (response.favorite ? 1 : -1)) })
      toast({ title: response.message, tone: 'success' })
      if (response.favorite) void track('favorite_product', { productId: product.id })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '操作失败', tone: 'error' })
    }
  }

  const contactSeller = async () => {
    if (!product || chatLoading) return
    setChatLoading(true)
    try {
      const response = await api.post<{ chat: ChatSummary }>('/chats', { productId: product.id, source: 'product_detail' })
      navigate(`/chat/${response.chat.id}`)
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '无法发起咨询', tone: 'error' })
    } finally {
      setChatLoading(false)
    }
  }

  const completeTrade = async () => {
    if (!product || tradeLoading) return
    setTradeLoading(true)
    try {
      const response = await api.post<{ trade: { id: string } }>('/trades/complete', { productId: product.id })
      setTradeOpen(false)
      navigate(`/trade/${response.trade.id}/success`)
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '交易确认失败', tone: 'error' })
    } finally {
      setTradeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Skeleton className="aspect-[4/3] rounded-[28px]" />
        <div className="space-y-4"><Skeleton className="h-10 w-4/5" /><Skeleton className="h-12 w-1/2" /><Skeleton className="h-40 w-full" /></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <PackageCheck className="size-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold">商品不存在或已下架</h1>
        <Button className="mt-6" onClick={() => navigate('/')}>返回附近</Button>
      </div>
    )
  }

  const isOwner = user?.id === product.seller.id
  const discount = Math.max(0, Math.round((1 - product.price / product.originalPrice) * 100))

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="size-4" />返回
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <section>
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-card">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-slate-100">
              <img src={product.images[0]} alt={product.title} className="size-full object-cover" />
              <div className="absolute left-4 top-4 flex gap-2">
                <StatusBadge status={product.status} className="bg-white/90 px-3 py-1.5 backdrop-blur" />
                {product.school === user?.school && <Badge variant="solid" className="px-3 py-1.5">同校</Badge>}
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => <img key={image + index} src={image} alt="" className="size-16 rounded-xl object-cover" />)}
              </div>
            )}
          </div>

          <div className="mt-4 hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-card lg:block">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Store className="size-4 text-violet-600" />卖家信息</h2>
            <div className="mt-4 flex items-start gap-4">
              <img src={product.seller.avatar} alt="" className="size-14 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900">{product.seller.nickname}</p>
                  {product.seller.certified && <VerifiedBadge school={product.seller.school} compact />}
                </div>
                <p className="mt-1 text-xs text-slate-500">{product.seller.grade} · {product.seller.major}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{product.seller.bio}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
                  <div><p className="font-black text-slate-900">{product.seller.tradeCount || 0}</p><p className="text-[10px] text-slate-500">完成交易</p></div>
                  <div><p className="font-black text-slate-900">{product.seller.rating || 5}</p><p className="text-[10px] text-slate-500">信用评分</p></div>
                  <div><p className="font-black text-slate-900">{product.seller.goodRate || 100}%</p><p className="text-[10px] text-slate-500">好评率</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{product.category}</Badge>
                  <Badge variant="slate">{product.condition}</Badge>
                </div>
                <h1 className="mt-3 font-display text-2xl font-black leading-9 tracking-[-0.04em] text-slate-950 sm:text-3xl">{product.title}</h1>
              </div>
              <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={toggleFavorite} aria-label="收藏">
                <Heart className={cn('size-5', product.isFavorite && 'fill-coral-500 text-coral-500')} />
              </Button>
            </div>
            <div className="mt-5"><Price value={product.price} original={product.originalPrice} size="large" /></div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <TrendingDown className="size-4 text-emerald-500" />比原价省 ¥{formatPrice(product.originalPrice - product.price)}，约为 {discount}% off
            </div>

            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 text-sm">
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-violet-600" /><div><p className="font-semibold text-slate-800">{product.tradePlace}</p><p className="mt-0.5 text-xs text-slate-500">距离你约 {formatDistance(product.distanceM)}，支持当面验货</p></div></div>
              <div className="flex items-start gap-3"><CalendarClock className="mt-0.5 size-4 text-violet-600" /><div><p className="font-semibold text-slate-800">{product.tradeTime}</p><p className="mt-0.5 text-xs text-slate-500">发布 {formatDateTime(product.createdAt)}</p></div></div>
              <div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-4 text-violet-600" /><div><p className="font-semibold text-slate-800">{product.usageDuration}</p><p className="mt-0.5 text-xs text-slate-500">使用周期由卖家填写</p></div></div>
            </div>

            <div className="mt-6 hidden gap-2 lg:grid lg:grid-cols-[1.15fr_.85fr]">
              {isOwner ? (
                <Button className="col-span-2" onClick={() => navigate('/profile')}>管理我的商品</Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => setTradeOpen(true)} disabled={product.status === 'completed'}><PackageCheck className="size-4" />确认交易</Button>
                  <Button size="lg" variant="outline" onClick={contactSeller} disabled={chatLoading}><MessageCircle className="size-4" />立即咨询</Button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-slate-900">商品描述</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p>
          </div>

          <div className="rounded-[24px] border border-violet-100 bg-violet-50/75 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><ShieldCheck className="size-4" /></div>
              <div>
                <p className="text-sm font-bold text-violet-950">CampusGo 交易保障</p>
                <p className="mt-1 text-xs leading-5 text-violet-700">建议在校园公共区域当面验货，确认商品无误后再完成交易。平台不会要求提前支付。</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card lg:hidden">
            <div className="flex items-center gap-3">
              <img src={product.seller.avatar} alt="" className="size-12 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="font-bold text-slate-900">{product.seller.nickname}</p><VerifiedBadge school={product.seller.school} compact /></div>
                <p className="mt-1 text-xs text-slate-500">{product.seller.tradeCount || 0} 笔交易 · 好评率 {product.seller.goodRate || 100}%</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500"><Star className="size-4 fill-current" /><span className="text-sm font-bold">{product.seller.rating || 5}</span></div>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-display text-xl font-black tracking-[-0.035em]">你可能也喜欢</h2><p className="mt-1 text-xs text-slate-500">来自同校或同分类的附近闲置</p></div>
            <Link to="/search" className="hidden items-center gap-1 text-sm font-semibold text-violet-600 sm:flex">继续逛逛<ChevronRight className="size-4" /></Link>
          </div>
          <ProductGrid products={related} compact />
        </section>
      )}

      {!isOwner && (
        <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleFavorite} aria-label="收藏"><Heart className={cn('size-5', product.isFavorite && 'fill-coral-500 text-coral-500')} /></Button>
            <Button variant="outline" className="flex-1" onClick={contactSeller} disabled={chatLoading}><MessageCircle className="size-4" />咨询</Button>
            <Button className="flex-[1.35]" onClick={() => setTradeOpen(true)} disabled={product.status === 'completed'}><PackageCheck className="size-4" />确认交易</Button>
          </div>
        </div>
      )}

      <Dialog open={tradeOpen} onOpenChange={(open) => { setTradeOpen(open); if (!open) setMeetupConfirmed(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认完成这笔交易？</DialogTitle>
            <DialogDescription>完成交易后，商品将标记为已出售，并进入评价流程。</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <img src={product.images[0]} alt="" className="size-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{product.title}</p><p className="mt-1 text-sm text-slate-500">交易地点：{product.tradePlace}</p></div>
              <span className="font-black text-coral-500">¥{formatPrice(product.price)}</span>
            </div>
          </div>
          <button onClick={() => setMeetupConfirmed((value) => !value)} className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50">
            <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border', meetupConfirmed ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white')}>{meetupConfirmed && <Check className="size-3.5" />}</span>
            <span className="text-xs leading-5 text-slate-600">我们已经在校园公共区域当面验货，并确认商品与描述一致。</span>
          </button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeOpen(false)}>再等等</Button>
            <Button onClick={completeTrade} disabled={!meetupConfirmed || tradeLoading}>{tradeLoading ? '处理中...' : '确认交易完成'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
