import { useEffect, useState } from 'react'
import { Activity, BarChart3, Eye, MessageCircle, PackagePlus, RefreshCw, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { api } from '../lib/api'
import { cn, formatDateTime } from '../lib/utils'
import type { DashboardData } from '../types'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/form'
import { PageHeader } from '../components/common/PageHeader'

const eventLabels: Record<string, string> = {
  view_home: '进入首页', expose_product: '商品曝光', click_product: '商品点击',
  click_publish: '进入发布', publish_product: '发布商品', publish_product_success: '发布成功',
  click_chat: '联系卖家', send_message: '发送消息', complete_trade: '完成交易', favorite_product: '收藏商品',
}

function TrendChart({ data }: { data: DashboardData['trend'] }) {
  const width = 760
  const height = 230
  const padding = { left: 16, right: 16, top: 20, bottom: 35 }
  const maxValue = Math.max(...data.map((item) => item.exposure), 1)
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const point = (value: number, index: number) => ({
    x: padding.left + (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2),
    y: padding.top + innerHeight - (value / maxValue) * innerHeight,
  })
  const line = (key: 'exposure' | 'clicks' | 'trades') => data.map((item, index) => {
    const p = point(item[key], index)
    return `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  }).join(' ')
  const area = `${line('exposure')} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label="商品曝光与点击趋势">
        <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#735CFF" stopOpacity=".24" /><stop offset="1" stopColor="#735CFF" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3].map((index) => <line key={index} x1={padding.left} x2={padding.left + innerWidth} y1={padding.top + (innerHeight / 3) * index} y2={padding.top + (innerHeight / 3) * index} stroke="#E8EAF1" strokeDasharray="4 6" />)}
        <path d={area} fill="url(#areaFill)" />
        <path d={line('exposure')} fill="none" stroke="#735CFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line('clicks')} fill="none" stroke="#17C77D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line('trades')} fill="none" stroke="#FF4F70" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const p = point(item.exposure, index)
          return <g key={item.date}><circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#735CFF" strokeWidth="3" /><text x={p.x} y={height - 10} textAnchor="middle" fill="#8A91A3" fontSize="12">{item.label}</text></g>
        })}
      </svg>
    </div>
  )
}

function MetricCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof Users; tone: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={cn('flex size-9 items-center justify-center rounded-xl', tone)}><Icon className="size-4" /></span></div>
      <p className="mt-4 font-display text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{note}</p>
    </div>
  )
}

export function AnalyticsPage() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get<DashboardData>('/analytics/dashboard', { days }).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [days])

  if (loading && !data) {
    return <div className="space-y-5"><Skeleton className="h-20 rounded-[24px]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[24px]" />)}</div><Skeleton className="h-80 rounded-[28px]" /></div>
  }
  if (!data) return null

  const funnelRows = [
    { label: '商品曝光', value: data.funnel.exposure, rate: 1, color: 'from-violet-500 to-violet-400' },
    { label: '商品点击', value: data.funnel.clicks, rate: data.funnel.clickRate, color: 'from-sky-500 to-sky-400' },
    { label: '发起咨询', value: data.funnel.chats, rate: data.funnel.consultRate, color: 'from-mint-500 to-mint-400' },
    { label: '完成成交', value: data.funnel.trades, rate: data.funnel.tradeRate, color: 'from-coral-500 to-coral-400' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics · 产品数据"
        title="数据看板"
        description="观察从商品曝光到成交的完整转化路径，用行为数据验证校园供需匹配效率。"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">{[[7, '7天'], [14, '14天'], [30, '30天']].map(([value, label]) => <button key={value} onClick={() => setDays(Number(value))} className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition', days === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>{label}</button>)}</div>
            <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="刷新数据"><RefreshCw className={cn('size-4', loading && 'animate-spin')} /></Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="DAU" value={String(data.metrics.dau)} note="今日活跃学生" icon={Users} tone="bg-violet-50 text-violet-600" />
        <MetricCard label="商品发布" value={String(data.metrics.published)} note={`近 ${days} 天新增`} icon={PackagePlus} tone="bg-sky-50 text-sky-600" />
        <MetricCard label="商品浏览量" value={String(data.metrics.productViews)} note="商品点击行为" icon={Eye} tone="bg-cyan-50 text-cyan-600" />
        <MetricCard label="聊天次数" value={String(data.metrics.chats)} note="联系卖家次数" icon={MessageCircle} tone="bg-mint-50 text-emerald-600" />
        <MetricCard label="成交数量" value={String(data.metrics.trades)} note="确认完成交易" icon={ShoppingBag} tone="bg-rose-50 text-rose-600" />
        <MetricCard label="校园 GMV" value={`¥${data.metrics.gmv.toLocaleString('zh-CN')}`} note="已成交商品金额" icon={BarChart3} tone="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="font-display text-xl font-black tracking-[-0.035em]">交易漏斗</h2><p className="mt-1 text-xs text-slate-500">曝光 → 点击 → 咨询 → 成交</p></div>
            <Badge variant="mint">整体转化 {(data.funnel.overallRate * 100).toFixed(2)}%</Badge>
          </div>
          <div className="mt-6 space-y-4">
            {funnelRows.map((row, index) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{row.label}</span><span className="text-slate-500">{row.value.toLocaleString('zh-CN')} {index > 0 && <strong className="ml-2 text-violet-600">{(row.rate * 100).toFixed(1)}%</strong>}</span></div>
                <div className="h-9 overflow-hidden rounded-xl bg-slate-100">
                  <div className={cn('flex h-full items-center rounded-xl bg-gradient-to-r pl-3 text-[11px] font-bold text-white transition-all duration-700', row.color)} style={{ width: `${Math.max(index === 0 ? 100 : row.rate * 100, 7)}%` }}>{index === 0 ? '100%' : `${(row.rate * 100).toFixed(1)}%`}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-900">{(data.funnel.clickRate * 100).toFixed(1)}%</p><p className="mt-1 text-[10px] text-slate-500">点击率</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-900">{(data.funnel.consultRate * 100).toFixed(1)}%</p><p className="mt-1 text-[10px] text-slate-500">咨询率</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-900">{(data.funnel.tradeRate * 100).toFixed(1)}%</p><p className="mt-1 text-[10px] text-slate-500">成交率</p></div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-display text-xl font-black tracking-[-0.035em]">行为趋势</h2><p className="mt-1 text-xs text-slate-500">每天的商品曝光、点击与成交变化</p></div><div className="flex gap-3 text-[10px]"><span className="inline-flex items-center gap-1.5 text-slate-500"><i className="size-2 rounded-full bg-violet-500" />曝光</span><span className="inline-flex items-center gap-1.5 text-slate-500"><i className="size-2 rounded-full bg-mint-500" />点击</span><span className="inline-flex items-center gap-1.5 text-slate-500"><i className="size-2 rounded-full bg-coral-500" />成交</span></div></div>
          <div className="mt-4"><TrendChart data={data.trend} /></div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.55fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-black tracking-[-0.035em]">热门商品</h2><p className="mt-1 text-xs text-slate-500">按商品点击事件排序</p></div><TrendingUp className="size-5 text-violet-500" /></div>
          <div className="mt-5 space-y-3">
            {data.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>
                <img src={product.image} alt="" className="size-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{product.title}</p><p className="mt-0.5 text-xs text-coral-500">¥{product.price.toLocaleString('zh-CN')}</p></div>
                <div className="text-right"><p className="text-sm font-black text-slate-900">{product.clicks}</p><p className="text-[10px] text-slate-400">点击</p></div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-slate-700">在售分类分布</h3>
            <div className="mt-3 space-y-2.5">
              {data.categories.map((item) => {
                const max = Math.max(...data.categories.map((category) => category.count), 1)
                return <div key={item.category} className="flex items-center gap-3"><span className="w-16 shrink-0 text-xs text-slate-500">{item.category}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(item.count / max) * 100}%` }} /></div><span className="w-5 text-right text-xs font-semibold text-slate-700">{item.count}</span></div>
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="font-display text-xl font-black tracking-[-0.035em]">实时事件流</h2><p className="mt-1 text-xs text-slate-500">用户关键行为按时间倒序记录</p></div><Badge variant="mint"><Activity className="size-3.5" />Live</Badge></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-slate-50 text-[11px] text-slate-500"><tr><th className="px-5 py-3 font-semibold">事件</th><th className="px-4 py-3 font-semibold">用户</th><th className="px-4 py-3 font-semibold">商品</th><th className="px-5 py-3 text-right font-semibold">时间</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentEvents.map((event) => (
                  <tr key={event.id} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3"><span className={cn('inline-flex rounded-lg px-2 py-1 font-semibold', event.eventName === 'complete_trade' ? 'bg-rose-50 text-rose-600' : event.eventName.includes('click') ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600')}>{eventLabels[event.eventName] || event.eventName}</span></td>
                    <td className="max-w-28 truncate px-4 py-3 text-slate-600">{event.userNickname}</td>
                    <td className="max-w-52 truncate px-4 py-3 text-slate-500">{event.productTitle || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-400">{formatDateTime(event.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-violet-100 bg-violet-50/70 p-5">
          <p className="text-xs font-bold text-violet-500">漏斗诊断</p>
          <h3 className="mt-2 text-sm font-bold text-violet-950">点击率 {(data.funnel.clickRate * 100).toFixed(1)}%</h3>
          <p className="mt-2 text-xs leading-5 text-violet-700">商品曝光到点击表现良好，下一阶段重点优化列表首图与价格信息表达。</p>
        </div>
        <div className="rounded-[24px] border border-mint-200 bg-mint-50/70 p-5">
          <p className="text-xs font-bold text-emerald-600">咨询转化</p>
          <h3 className="mt-2 text-sm font-bold text-emerald-950">咨询率 {(data.funnel.consultRate * 100).toFixed(1)}%</h3>
          <p className="mt-2 text-xs leading-5 text-emerald-700">详情页交易地点与卖家信用信息较完整，能有效推动用户发起咨询。</p>
        </div>
        <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-5">
          <p className="text-xs font-bold text-rose-500">成交效率</p>
          <h3 className="mt-2 text-sm font-bold text-rose-950">咨询成交率 {(data.funnel.tradeRate * 100).toFixed(1)}%</h3>
          <p className="mt-2 text-xs leading-5 text-rose-700">可进一步增加可交易时间段快捷确认，减少买卖双方对交付时间的反复沟通。</p>
        </div>
      </section>
    </div>
  )
}
