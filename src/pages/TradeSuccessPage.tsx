import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, HeartHandshake, Home, MapPin, PackageCheck, Star, ThumbsUp } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDateTime, formatPrice } from '../lib/utils'
import type { Trade } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton, Textarea } from '../components/ui/form'
import { cn } from '../lib/utils'
import { VerifiedBadge } from '../components/common/VerifiedBadge'

const reviewTags = ['描述一致', '回复及时', '守时', '态度友好', '包装仔细', '交易顺利']

export function TradeSuccessPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>(['描述一致', '回复及时'])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<{ trade: Trade; review: unknown | null }>(`/trades/${id}`)
      .then((response) => { setTrade(response.trade); setSubmitted(Boolean(response.review)) })
      .catch((error) => toast({ title: error instanceof Error ? error.message : '交易信息加载失败', tone: 'error' }))
      .finally(() => setLoading(false))
  }, [id, toast])

  const toggleTag = (tag: string) => setTags((items) => items.includes(tag) ? items.filter((item) => item !== tag) : [...items, tag])

  const submitReview = async () => {
    setSubmitting(true)
    try {
      await api.post(`/trades/${id}/review`, { rating, content, tags })
      setSubmitted(true)
      toast({ title: '评价已提交', description: '你的反馈会帮助校园社区建立信任', tone: 'success' })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '评价提交失败', tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl space-y-4 py-8"><Skeleton className="h-72 rounded-[30px]" /><Skeleton className="h-64 rounded-[30px]" /></div>
  if (!trade) return null

  const isBuyer = trade.buyer.id === user?.id
  const other = isBuyer ? trade.seller : trade.buyer

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-10 text-center text-white shadow-[0_28px_80px_rgba(25,24,61,.25)] sm:px-10 sm:py-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -left-20 -top-20 size-64 rounded-full bg-mint-400/25 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-64 rounded-full bg-violet-500/35 blur-3xl" />
        {Array.from({ length: 14 }).map((_, index) => <span key={index} className="absolute size-2 rounded-full" style={{ left: `${8 + (index * 17) % 86}%`, top: `${10 + (index * 29) % 72}%`, background: index % 3 === 0 ? '#D9FFEB' : index % 3 === 1 ? '#B9ADFF' : '#FFD4DD', transform: `rotate(${index * 27}deg)`, opacity: .75 }} />)}
        <div className="relative mx-auto flex size-20 items-center justify-center rounded-[28px] bg-mint-300 text-emerald-950 shadow-[0_16px_40px_rgba(62,220,150,.3)]"><span className="text-4xl">🎉</span></div>
        <h1 className="relative mt-5 font-display text-3xl font-black tracking-[-0.05em] sm:text-4xl">交易完成</h1>
        <p className="relative mt-3 text-sm text-slate-300">感谢使用 CampusGo，让闲置继续在校园里发光。</p>
        <div className="relative mx-auto mt-7 max-w-xl rounded-[24px] border border-white/10 bg-white/10 p-4 text-left backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img src={trade.product.images[0]} alt="" className="size-16 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{trade.product.title}</p><p className="mt-1 flex items-center gap-2 text-xs text-slate-400"><MapPin className="size-3" />{trade.product.tradePlace}</p></div>
            <p className="text-lg font-black text-mint-300">¥{formatPrice(trade.product.price)}</p>
          </div>
        </div>
      </section>

      <section className="relative -mt-3 rounded-[30px] border border-slate-200 bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <img src={other.avatar} alt="" className="size-12 rounded-2xl" />
            <div><div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-900">{other.nickname}</p><VerifiedBadge compact /></div><p className="mt-1 text-xs text-slate-500">{isBuyer ? '卖家' : '买家'} · {other.school}</p></div>
          </div>
          <Badge variant="mint"><CheckCircle2 className="size-3.5" />已成交</Badge>
        </div>

        {isBuyer && !submitted ? (
          <div className="mt-5">
            <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><HeartHandshake className="size-5" /></span><div><h2 className="font-bold text-slate-900">给这次交易留个评价</h2><p className="mt-1 text-xs leading-5 text-slate-500">真实反馈会影响卖家的信用分，也会帮助其他同学判断。</p></div></div>
            <div className="mt-5 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => <button key={value} onMouseEnter={() => setHoverRating(value)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value)} className="rounded-lg p-1 transition hover:scale-110" aria-label={`${value} 星`}><Star className={cn('size-8', value <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} /></button>)}
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-slate-500">{rating === 5 ? '非常满意' : rating === 4 ? '比较满意' : rating === 3 ? '一般' : '需要改进'}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">{reviewTags.map((tag) => <button key={tag} onClick={() => toggleTag(tag)} className={cn('rounded-full border px-3 py-2 text-xs font-semibold transition', tags.includes(tag) ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-200')}>{tag}</button>)}</div>
            <Textarea className="mt-5" value={content} onChange={(event) => setContent(event.target.value)} placeholder="写几句真实感受，帮助校园社区建立信任（选填）" maxLength={300} />
            <Button className="mt-4 w-full" size="lg" onClick={submitReview} disabled={submitting}><ThumbsUp className="size-4" />{submitting ? '提交中...' : '提交评价'}</Button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-mint-50 p-5 text-center">
            <CheckCircle2 className="mx-auto size-9 text-emerald-600" />
            <h2 className="mt-3 font-bold text-emerald-900">{submitted ? '评价已完成' : '这是一笔已完成的校园交易'}</h2>
            <p className="mt-1 text-xs leading-5 text-emerald-700">交易完成于 {formatDateTime(trade.completedAt)}。信用记录会持续沉淀在双方主页。</p>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => navigate(`/product/${trade.product.id}`)}><PackageCheck className="size-4" />查看商品</Button>
          <Button onClick={() => navigate('/')}><Home className="size-4" />返回附近<ArrowRight className="size-4" /></Button>
        </div>
      </section>
    </div>
  )
}
