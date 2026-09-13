import { useEffect, useState, type ChangeEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Box, Camera, Check, ChevronLeft, ImagePlus, Lamp, Package, Send, Smartphone, Sparkles, Upload, WandSparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { track } from '../lib/analytics'
import { cn, formatDistance, formatPrice } from '../lib/utils'
import type { Product } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/button'
import { Input, Label, Select, Textarea } from '../components/ui/form'
import { Badge } from '../components/ui/badge'
import { VerifiedBadge } from '../components/common/VerifiedBadge'

const categoryOptions = [
  { value: '教材', icon: BookOpen, hint: '教材、考辅、计算器' },
  { value: '数码', icon: Smartphone, hint: '电脑、平板、耳机' },
  { value: '宿舍用品', icon: Lamp, hint: '台灯、冰箱、水壶' },
  { value: '家具', icon: Package, hint: '椅子、桌子、收纳' },
  { value: '运动用品', icon: Box, hint: '球拍、自行车、健身' },
  { value: '其他', icon: Package, hint: '背包、乐器、杂物' },
]

const conditionOptions = ['全新', '9成新', '8成新', '7成新', '有使用痕迹']
const placeOptions = [
  { type: '宿舍楼', place: '女生宿舍3号楼', distance: 180, hint: '适合宿舍区内的生活用品' },
  { type: '教学楼', place: '教学楼3号楼大厅', distance: 320, hint: '下课时顺路交付，节省时间' },
  { type: '校门', place: '东校门保安亭旁', distance: 560, hint: '适合自行车等大件物品' },
]

interface PublishForm {
  title: string
  category: string
  price: string
  originalPrice: string
  condition: string
  usageDuration: string
  description: string
  placeType: string
  tradePlace: string
  tradeTime: string
  images: string[]
}

const initialForm: PublishForm = {
  title: '',
  category: '数码',
  price: '',
  originalPrice: '',
  condition: '9成新',
  usageDuration: '',
  description: '',
  placeType: '宿舍楼',
  tradePlace: '女生宿舍3号楼',
  tradeTime: '',
  images: [],
}

export function PublishPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<PublishForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [successProduct, setSuccessProduct] = useState<Product | null>(null)
  const [valuation, setValuation] = useState<{ low: number; high: number; suggested: number; confidence: number; reasons: string[] } | null>(null)
  const [valuationLoading, setValuationLoading] = useState(false)

  useEffect(() => {
    void track('click_publish', { onceKey: 'click-publish-session' })
  }, [])

  const update = (field: keyof PublishForm, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const chooseCategory = (category: string) => {
    setForm((current) => ({ ...current, category }))
    setValuation(null)
  }

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: '图片不能超过 4MB', tone: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, images: [String(reader.result)] }))
    reader.readAsDataURL(file)
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return '给商品起一个清楚的名称'
      if (!form.price || Number(form.price) <= 0) return '请填写有效的出售价'
      if (!form.originalPrice || Number(form.originalPrice) <= 0) return '请填写商品原价'
      if (Number(form.price) > Number(form.originalPrice)) return '出售价通常不应高于原价'
      if (!form.description.trim()) return '补充几件买家最关心的事情'
    }
    if (step === 1 && !form.tradeTime.trim()) return '请填写你方便交易的时间'
    return null
  }

  const nextStep = () => {
    const error = validateStep()
    if (error) {
      toast({ title: error, tone: 'error' })
      return
    }
    setStep((current) => Math.min(2, current + 1))
  }

  const getValuation = async () => {
    if (!form.originalPrice) {
      toast({ title: '先填写商品原价后再估价', tone: 'info' })
      return
    }
    setValuationLoading(true)
    try {
      const response = await api.post<{ low: number; high: number; suggested: number; confidence: number; reasons: string[] }>('/valuation', {
        category: form.category,
        originalPrice: Number(form.originalPrice),
        condition: form.condition,
        usageMonths: form.usageDuration ? Number(form.usageDuration.replace(/\D/g, '')) || 12 : 12,
      })
      setValuation(response)
      setForm((current) => ({ ...current, price: String(response.suggested) }))
      toast({ title: '已根据同类成交生成建议价', tone: 'success' })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '暂时无法估价', tone: 'error' })
    } finally {
      setValuationLoading(false)
    }
  }

  const publish = async () => {
    const error = validateStep()
    if (error) {
      toast({ title: error, tone: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const response = await api.post<{ product: Product }>('/products', {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
      })
      setSuccessProduct(response.product)
      void track('publish_product_success', { productId: response.product.id, metadata: { category: form.category, price: Number(form.price) } })
      toast({ title: '商品发布成功', description: '已优先推荐给同校同学', tone: 'success' })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '发布失败', tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (successProduct) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-float">
          <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-center text-white">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-mint-300 text-emerald-950 shadow-lg"><Check className="size-8" strokeWidth={3} /></div>
            <h1 className="relative mt-4 font-display text-2xl font-black tracking-[-0.04em]">商品已发布</h1>
            <p className="relative mt-2 text-sm text-slate-300">已根据你的校园位置，优先展示给附近同学。</p>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex gap-4 rounded-2xl border border-slate-200 p-3">
              <img src={successProduct.images[0]} alt="" className="size-24 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 py-1">
                <Badge variant="mint">出售中</Badge>
                <h2 className="mt-2 line-clamp-2 font-bold text-slate-900">{successProduct.title}</h2>
                <p className="mt-2 text-xl font-black text-coral-500">¥{formatPrice(successProduct.price)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDistance(successProduct.distanceM)} · {successProduct.tradePlace}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-violet-50 p-4 text-center">
              <div><p className="text-lg font-black text-violet-700">1,284</p><p className="text-[10px] text-violet-500">预计触达</p></div>
              <div><p className="text-lg font-black text-violet-700">500m</p><p className="text-[10px] text-violet-500">推荐半径</p></div>
              <div><p className="text-lg font-black text-violet-700">立即</p><p className="text-[10px] text-violet-500">进入推荐</p></div>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => navigate(`/product/${successProduct.id}`)}>查看商品详情</Button>
              <Button variant="outline" onClick={() => { setForm(initialForm); setSuccessProduct(null); setStep(0) }}>继续发布</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selectedPlace = placeOptions.find((place) => place.type === form.placeType) || placeOptions[0]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-violet-500">发布闲置</p>
          <h1 className="mt-2 font-display text-2xl font-black tracking-[-0.04em] sm:text-3xl">让需要它的人，离你很近</h1>
          <p className="mt-2 text-sm text-slate-500">完整的商品与交付信息，能显著减少反复沟通。</p>
        </div>
        <VerifiedBadge school={user?.school} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_310px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            {['商品信息', '交易方式', '确认发布'].map((label, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <button onClick={() => index < step && setStep(index)} className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition', index <= step ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400')}>
                  {index < step ? <Check className="size-4" /> : index + 1}
                </button>
                <span className={cn('hidden truncate text-xs font-semibold sm:block', index <= step ? 'text-slate-800' : 'text-slate-400')}>{label}</span>
                {index < 2 && <span className={cn('h-px flex-1', index < step ? 'bg-violet-300' : 'bg-slate-200')} />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="animate-fade-up space-y-5">
              <div>
                <Label>商品图片</Label>
                <label className="group relative flex aspect-[2.4] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-violet-300 hover:bg-violet-50/50">
                  {form.images[0] ? (
                    <>
                      <img src={form.images[0]} alt="商品预览" className="size-full object-cover" />
                      <span className="absolute bottom-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"><Camera className="mr-1 inline size-3.5" />更换图片</span>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm"><ImagePlus className="size-6" /></div>
                      <p className="mt-3 text-sm font-bold text-slate-800">点击上传商品图片</p>
                      <p className="mt-1 text-xs text-slate-400">建议 4:3，单张不超过 4MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
                </label>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400"><Upload className="size-3.5" />没有图片也可以发布，系统会使用分类插画作为封面。</div>
              </div>

              <div>
                <Label htmlFor="title">商品名称</Label>
                <Input id="title" value={form.title} maxLength={60} onChange={(event) => update('title', event.target.value)} placeholder="例如：iPad Air 5 64G 深空灰" />
                <p className="mt-1.5 text-right text-[11px] text-slate-400">{form.title.length}/60</p>
              </div>

              <div>
                <Label>商品分类</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categoryOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button key={option.value} type="button" onClick={() => chooseCategory(option.value)} className={cn('rounded-2xl border p-3 text-left transition', form.category === option.value ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 hover:border-violet-200')}>
                        <Icon className={cn('size-5', form.category === option.value ? 'text-violet-600' : 'text-slate-400')} />
                        <p className="mt-2 text-sm font-bold text-slate-800">{option.value}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{option.hint}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="price">出售价（¥）</Label><Input id="price" type="number" min="1" value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="2800" /></div>
                <div><Label htmlFor="originalPrice">原价（¥）</Label><Input id="originalPrice" type="number" min="1" value={form.originalPrice} onChange={(event) => update('originalPrice', event.target.value)} placeholder="4399" /></div>
              </div>

              <button type="button" onClick={getValuation} disabled={valuationLoading} className="flex w-full items-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-sky-50 p-4 text-left transition hover:border-violet-300">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><WandSparkles className="size-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-violet-950">AI 智能估价建议</span><span className="mt-0.5 block text-xs text-violet-600">{valuation ? `建议 ¥${valuation.low}-${valuation.high}，置信度 ${valuation.confidence}%` : '参考同校同类商品成交，帮你更快定价'}</span></span>
                <span className="text-xs font-bold text-violet-600">{valuationLoading ? '分析中' : '试试看'}</span>
              </button>
              {valuation && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-900">建议定价 ¥{valuation.suggested}</p><Badge variant="mint">置信度 {valuation.confidence}%</Badge></div>
                  <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500">{valuation.reasons.map((reason) => <li key={reason} className="flex gap-2"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-500" />{reason}</li>)}</ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="condition">新旧程度</Label><Select id="condition" value={form.condition} onChange={(event) => update('condition', event.target.value)}>{conditionOptions.map((item) => <option key={item}>{item}</option>)}</Select></div>
                <div><Label htmlFor="usage">使用时间</Label><Input id="usage" value={form.usageDuration} onChange={(event) => update('usageDuration', event.target.value)} placeholder="例如：1 年 2 个月" /></div>
              </div>

              <div><Label htmlFor="description">商品描述</Label><Textarea id="description" value={form.description} maxLength={500} onChange={(event) => update('description', event.target.value)} placeholder="描述成色、配件、使用感受，以及买家需要提前知道的问题..." /><p className="mt-1.5 text-right text-[11px] text-slate-400">{form.description.length}/500</p></div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-up space-y-6">
              <div>
                <Label>选择交易地点</Label>
                <div className="space-y-2">
                  {placeOptions.map((place) => (
                    <button key={place.type} type="button" onClick={() => setForm((current) => ({ ...current, placeType: place.type, tradePlace: place.place }))} className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition', form.placeType === place.type ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 hover:border-violet-200')}>
                      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', form.placeType === place.type ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500')}><Package className="size-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{place.type} · {place.place}</span><span className="mt-1 block text-xs text-slate-500">距离约 {formatDistance(place.distance)}，{place.hint}</span></span>
                      {form.placeType === place.type && <Check className="size-5 text-violet-600" />}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label htmlFor="tradeTime">可交易时间</Label><Input id="tradeTime" value={form.tradeTime} onChange={(event) => update('tradeTime', event.target.value)} placeholder="例如：工作日 18:00-21:00" /><p className="mt-2 text-xs leading-5 text-slate-400">建议给出明确时间范围，买家更容易发起联系。</p></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800"><strong className="block text-sm">安全提醒</strong>大件物品建议选择宿舍楼下或校门保安亭附近；交易时请当面验货，避免提前转账。</div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up">
              <h2 className="text-lg font-bold text-slate-900">发布前最后确认</h2>
              <p className="mt-1 text-sm text-slate-500">商品将以“出售中”状态立即出现在附近推荐中。</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]">
                <img src={form.images[0] || '/assets/products/backpack.svg'} alt="商品预览" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                <div>
                  <div className="flex flex-wrap gap-2"><Badge>{form.category}</Badge><Badge variant="slate">{form.condition}</Badge></div>
                  <h3 className="mt-3 font-display text-xl font-black text-slate-950">{form.title}</h3>
                  <p className="mt-2 text-2xl font-black text-coral-500">¥{formatPrice(Number(form.price || 0))}</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>交易地点：{selectedPlace.place} · {formatDistance(selectedPlace.distance)}</p>
                    <p>交易时间：{form.tradeTime}</p>
                    <p>使用时间：{form.usageDuration || '未填写'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{form.description}</div>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => step === 0 ? navigate(-1) : setStep((current) => current - 1)}><ChevronLeft className="size-4" />{step === 0 ? '取消' : '上一步'}</Button>
            {step < 2 ? (
              <Button onClick={nextStep}>下一步<ArrowRight className="size-4" /></Button>
            ) : (
              <Button onClick={publish} disabled={submitting}><Send className="size-4" />{submitting ? '正在发布...' : '确认发布'}</Button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2"><ArrowLeft className="size-4 text-violet-600" /><h2 className="font-bold text-slate-900">发布小贴士</h2></div>
            <div className="mt-4 space-y-4 text-xs leading-5 text-slate-500">
              <div className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-bold text-violet-600">1</span><p>标题写清品牌、型号和关键规格，搜索结果更准确。</p></div>
              <div className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-bold text-violet-600">2</span><p>主动说明瑕疵和配件情况，可以减少无效咨询。</p></div>
              <div className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-bold text-violet-600">3</span><p>交易地点选在公共区域，买家更放心。</p></div>
            </div>
          </div>
          <div className="overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-600 to-violet-500 p-5 text-white shadow-[0_18px_40px_rgba(94,70,240,.22)]">
            <Sparkles className="size-5 text-mint-300" />
            <p className="mt-3 text-sm font-bold">毕业清仓建议</p>
            <p className="mt-2 text-xs leading-5 text-violet-100">把同一宿舍的多件物品集中发布，并标记统一交付时间，平均可减少约 40% 的沟通轮次。</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
