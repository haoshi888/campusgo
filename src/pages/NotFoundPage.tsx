import { Compass, Home, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] bg-violet-50 text-violet-600"><Compass className="size-9" /></div>
        <p className="mt-6 font-display text-6xl font-black tracking-[-0.06em] text-slate-950">404</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">这条路走不到校园集市</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">页面可能已下架或链接有误。回到附近看看正在出售的闲置吧。</p>
        <div className="mt-7 flex justify-center gap-2"><Button variant="outline" onClick={() => navigate('/search')}><Search className="size-4" />搜索商品</Button><Button onClick={() => navigate('/')}><Home className="size-4" />返回首页</Button></div>
      </div>
    </div>
  )
}
