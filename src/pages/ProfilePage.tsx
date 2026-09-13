import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Bookmark, ChevronRight, LogOut, PackageCheck, ShieldCheck, Star, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDateTime, formatPrice } from '../lib/utils'
import type { Product, Trade } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input, Label, Select } from '../components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { EmptyState } from '../components/common/EmptyState'
import { ProductGrid, ProductSkeletonGrid } from '../components/product/ProductGrid'
import { VerifiedBadge } from '../components/common/VerifiedBadge'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, certify, logout } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [favorites, setFavorites] = useState<Product[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [certifyOpen, setCertifyOpen] = useState(false)
  const [certifyLoading, setCertifyLoading] = useState(false)
  const [certForm, setCertForm] = useState({ school: user?.school || '江城大学', grade: user?.grade || '大四', major: user?.major || '' })

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.get<{ products: Product[] }>('/me/products'),
      api.get<{ products: Product[] }>('/favorites'),
      api.get<{ trades: Trade[] }>('/trades'),
    ]).then(([myProducts, favoriteResponse, tradeResponse]) => {
      if (!active) return
      setProducts(myProducts.products)
      setFavorites(favoriteResponse.products)
      setTrades(tradeResponse.trades)
    }).catch((error) => {
      toast({ title: error instanceof Error ? error.message : '个人信息加载失败', tone: 'error' })
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [toast])

  const selling = useMemo(() => products.filter((product) => product.status !== 'completed'), [products])
  const sold = useMemo(() => products.filter((product) => product.status === 'completed'), [products])

  const submitCertify = async () => {
    setCertifyLoading(true)
    try {
      await certify(certForm)
      setCertifyOpen(false)
      toast({ title: '校园身份认证成功', description: `${certForm.school} · ${certForm.grade}`, tone: 'success' })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '认证失败', tone: 'error' })
    } finally {
      setCertifyLoading(false)
    }
  }

  const updateStatus = async (productId: string, status: Product['status']) => {
    try {
      const response = await api.patch<{ product: Product }>(`/products/${productId}/status`, { status })
      setProducts((items) => items.map((item) => item.id === productId ? response.product : item))
      toast({ title: status === 'completed' ? '已标记为已出售' : '商品状态已更新', tone: 'success' })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '更新失败', tone: 'error' })
    }
  }

  const signOut = () => {
    logout()
    navigate('/auth')
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(26,27,58,.2)] sm:p-7">
        <div className="absolute -right-20 -top-28 size-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <img src={user.avatar} alt="" className="size-20 rounded-[26px] border-2 border-white/20 sm:size-24" />
            <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-xl border-4 border-slate-950 bg-mint-300 text-emerald-950"><BadgeCheck className="size-4" /></span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-black tracking-[-0.04em]">{user.nickname}</h1>
              <VerifiedBadge school={user.school} compact />
            </div>
            <p className="mt-2 text-sm text-slate-300">{user.school} · {user.grade} · {user.major || '专业待完善'}</p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-slate-400">{user.bio || '在 CampusGo 发现附近好物，也把闲置交给需要的人。'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => setCertifyOpen(true)}><ShieldCheck className="size-4" />认证信息</Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-white/10 hover:text-white" onClick={signOut} aria-label="退出登录"><LogOut className="size-4" /></Button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-center"><p className="text-xl font-black">{user.tradeCount}</p><p className="mt-1 text-[10px] text-slate-400">完成交易</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-center"><p className="text-xl font-black">{user.rating}</p><p className="mt-1 text-[10px] text-slate-400">信用评分</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-center"><p className="text-xl font-black">{user.goodRate}%</p><p className="mt-1 text-[10px] text-slate-400">好评率</p></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><ShieldCheck className="size-5" /></span><Badge variant="mint">30 分</Badge></div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">校园身份认证</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{user.school} · {user.grade}，认证信息仅用于校园信任展示。</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-mint-50 text-emerald-600"><TrendingUp className="size-5" /></span><Badge variant="mint">{Math.round(user.goodRate * 0.4)} 分</Badge></div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">交易表现</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">完成 {user.tradeCount} 笔交易，历史好评率 {user.goodRate}%。</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Star className="size-5 fill-current" /></span><Badge variant="amber">优秀</Badge></div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">社区信用</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">回复及时、描述一致、守时交付等标签会持续提升信用。</p>
        </div>
      </section>

      <Tabs defaultValue="selling">
        <div className="no-scrollbar overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="selling">发布中 <span className="ml-1 text-[10px] text-slate-400">{selling.length}</span></TabsTrigger>
            <TabsTrigger value="sold">已出售 <span className="ml-1 text-[10px] text-slate-400">{sold.length}</span></TabsTrigger>
            <TabsTrigger value="trades">交易记录 <span className="ml-1 text-[10px] text-slate-400">{trades.length}</span></TabsTrigger>
            <TabsTrigger value="favorites">收藏 <span className="ml-1 text-[10px] text-slate-400">{favorites.length}</span></TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="selling">
          {loading ? <ProductSkeletonGrid count={4} /> : selling.length ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selling.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <img src={product.images[0]} alt="" className="size-14 rounded-xl object-cover" />
                    <button onClick={() => navigate(`/product/${product.id}`)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-bold text-slate-900">{product.title}</p>
                      <p className="mt-1 text-xs text-slate-500">¥{formatPrice(product.price)} · {product.views} 次浏览</p>
                    </button>
                    <Button size="sm" variant={product.status === 'reserved' ? 'secondary' : 'outline'} onClick={() => void updateStatus(product.id, product.status === 'reserved' ? 'available' : 'reserved')}>{product.status === 'reserved' ? '取消预订' : '标记预订'}</Button>
                  </div>
                ))}
              </div>
              <ProductGrid products={selling} />
            </div>
          ) : <EmptyState icon={PackageCheck} title="还没有发布商品" description="毕业清仓或闲置转让都可以从发布一件商品开始。" actionLabel="去发布" onAction={() => navigate('/publish')} />}
        </TabsContent>

        <TabsContent value="sold">
          {loading ? <ProductSkeletonGrid count={3} /> : sold.length ? <ProductGrid products={sold} /> : <EmptyState icon={PackageCheck} title="暂无已出售商品" description="完成交易后，商品会自动归档到这里。" />}
        </TabsContent>

        <TabsContent value="trades">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : trades.length ? (
            <div className="space-y-3">
              {trades.map((trade) => {
                const other = trade.buyer.id === user.id ? trade.seller : trade.buyer
                const role = trade.buyer.id === user.id ? '买入' : '卖出'
                return (
                  <button key={trade.id} onClick={() => navigate(`/product/${trade.product.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-card">
                    <img src={trade.product.images[0]} alt="" className="size-16 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><Badge variant="mint">{role} · 已完成</Badge><span className="text-[11px] text-slate-400">{formatDateTime(trade.completedAt)}</span></div>
                      <p className="mt-1.5 truncate text-sm font-bold text-slate-900">{trade.product.title}</p>
                      <p className="mt-1 text-xs text-slate-500">与 {other.nickname} 交易 · ¥{formatPrice(trade.product.price)}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-400" />
                  </button>
                )
              })}
            </div>
          ) : <EmptyState icon={PackageCheck} title="暂无交易记录" description="完成第一笔校园面交后，交易记录会保存在这里。" />}
        </TabsContent>

        <TabsContent value="favorites">
          {loading ? <ProductSkeletonGrid count={4} /> : favorites.length ? <ProductGrid products={favorites} /> : <EmptyState icon={Bookmark} title="还没有收藏商品" description="收藏感兴趣的商品，方便之后快速回来查看。" actionLabel="去发现" onAction={() => navigate('/')} />}
        </TabsContent>
      </Tabs>

      <Dialog open={certifyOpen} onOpenChange={setCertifyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>校园身份认证</DialogTitle><DialogDescription>Demo 中认证即时通过。真实产品可接入学信网、校园邮箱或学生证 OCR。</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="school">学校</Label><Select id="school" value={certForm.school} onChange={(event) => setCertForm((current) => ({ ...current, school: event.target.value }))}><option>江城大学</option><option>江城理工大学</option><option>江城师范大学</option></Select></div>
            <div><Label htmlFor="grade">年级</Label><Select id="grade" value={certForm.grade} onChange={(event) => setCertForm((current) => ({ ...current, grade: event.target.value }))}><option>大一</option><option>大二</option><option>大三</option><option>大四</option><option>研究生</option></Select></div>
            <div><Label htmlFor="major">专业</Label><Input id="major" value={certForm.major} onChange={(event) => setCertForm((current) => ({ ...current, major: event.target.value }))} placeholder="例如：新闻传播" /></div>
            <div className="flex items-start gap-3 rounded-2xl bg-mint-50 p-4 text-xs leading-5 text-emerald-700"><ShieldCheck className="mt-0.5 size-4 shrink-0" />认证后仅展示“已认证学生”和学校，不会公开你的学号或联系方式。</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCertifyOpen(false)}>取消</Button><Button onClick={submitCertify} disabled={certifyLoading}>{certifyLoading ? '认证中...' : '完成认证'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
