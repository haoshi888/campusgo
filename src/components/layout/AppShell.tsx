import { useEffect } from 'react'
import { BarChart3, Home, MessageCircle, PlusCircle, Search, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { CampusLogo } from '../common/CampusLogo'
import { VerifiedBadge } from '../common/VerifiedBadge'

const navItems = [
  { to: '/', label: '附近', icon: Home, end: true },
  { to: '/search', label: '搜索', icon: Search },
  { to: '/publish', label: '发布', icon: PlusCircle },
  { to: '/chat', label: '消息', icon: MessageCircle },
  { to: '/profile', label: '我的', icon: UserRound },
]

export function AppShell() {
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-canvas text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-slate-200/80 bg-white/95 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <CampusLogo className="px-2" />
        <div className="mt-7 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 p-3 text-white shadow-[0_14px_30px_rgba(94,70,240,.22)]">
          <p className="text-[11px] font-semibold text-violet-100">当前校园</p>
          <p className="mt-1 text-sm font-bold">{user?.school || '江城大学'}</p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-violet-100">
            <span>{user?.grade || '学生'} · {user?.major || '未填写专业'}</span>
            <span className="size-2 rounded-full bg-mint-300 shadow-[0_0_0_4px_rgba(175,249,211,.18)]" />
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition',
                  isActive ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('size-[18px]', isActive && 'text-violet-600')} />
                    <span>{item.label}</span>
                    {item.to === '/chat' && <span className="ml-auto rounded-full bg-mint-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">3</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition',
              isActive ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <BarChart3 className="size-[18px]" />
            数据看板
          </NavLink>
          <p className="mt-3 px-3 text-[11px] leading-5 text-slate-400">这里是产品 Demo，数据支持一键重置。</p>
        </div>

        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-2.5">
            <img src={user?.avatar || '/assets/avatar-new.svg'} alt="" className="size-9 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{user?.nickname || '同学'}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.school || '校园用户'}</p>
            </div>
          </div>
          <VerifiedBadge compact className="mt-3 w-fit" />
        </div>
      </aside>

      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-canvas/90 px-4 backdrop-blur-xl lg:hidden">
          <CampusLogo />
          <div className="flex items-center gap-2">
            <VerifiedBadge compact />
            <img src={user?.avatar || '/assets/avatar-new.svg'} alt="" className="size-9 rounded-xl" />
          </div>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-[1440px] px-3 pb-28 pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isPublish = item.to === '/publish'
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  'relative flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition',
                  isPublish && '-mt-5',
                  isActive && !isPublish ? 'text-violet-700' : 'text-slate-400',
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn(
                      'flex size-8 items-center justify-center rounded-xl transition',
                      isPublish && 'size-12 rounded-2xl bg-violet-600 text-white shadow-[0_10px_24px_rgba(94,70,240,.32)]',
                      isActive && !isPublish && 'bg-violet-50',
                    )}>
                      <Icon className={cn(isPublish ? 'size-6' : 'size-5')} />
                    </span>
                    <span className={cn(isPublish && 'text-violet-700')}>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
