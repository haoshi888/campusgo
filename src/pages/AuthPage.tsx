import { useState, type FormEvent } from 'react'
import { ArrowRight, BadgeCheck, Eye, EyeOff, GraduationCap, LockKeyhole, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/button'
import { Input, Label, Select } from '../components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export function AuthPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ phone: '13800000000', password: 'campusgo' })
  const [registerForm, setRegisterForm] = useState({ phone: '', password: '', nickname: '', school: '江城大学', grade: '大四', major: '' })

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login(loginForm.phone, loginForm.password)
      toast({ title: '登录成功', description: '欢迎回到 CampusGo', tone: 'success' })
      navigate('/')
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '登录失败', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await register(registerForm)
      toast({ title: '注册成功', description: '校园身份已认证', tone: 'success' })
      navigate('/')
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '注册失败', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async () => {
    setLoading(true)
    try {
      await login('13800000000', 'campusgo')
      navigate('/')
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '演示账号登录失败', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="absolute -left-32 top-20 size-96 rounded-full bg-violet-600/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-80 rounded-full bg-mint-400/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <img src="/assets/logo-mark.svg" alt="" className="size-11 rounded-2xl" />
            <div><p className="text-xl font-black tracking-[-0.04em]">CampusGo</p><p className="text-[10px] font-semibold tracking-[0.1em] text-violet-300">NEARBY & TRUSTED</p></div>
          </div>
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-violet-100"><ShieldCheck className="size-4 text-mint-300" />校园身份认证 · 同校优先推荐</div>
            <h1 className="mt-6 font-display text-5xl font-black leading-[1.08] tracking-[-0.055em] xl:text-6xl">附近的学生，<br />交易附近的闲置。</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">从宿舍到教学楼，用最短的距离完成一次可信、轻松、低成本的校园二手交易。</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><MapPin className="size-5 text-violet-300" /><p className="mt-3 text-2xl font-black">380m</p><p className="mt-1 text-[11px] text-slate-400">平均交易距离</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><BadgeCheck className="size-5 text-mint-300" /><p className="mt-3 text-2xl font-black">98%</p><p className="mt-1 text-[11px] text-slate-400">卖家好评率</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><Sparkles className="size-5 text-sky-300" /><p className="mt-3 text-2xl font-black">1.2k</p><p className="mt-1 text-[11px] text-slate-400">校内在售商品</p></div>
            </div>
          </div>
          <p className="relative text-xs text-slate-500">CampusGo MVP · 产品经理作品演示</p>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8 text-slate-900 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden"><img src="/assets/logo-mark.svg" alt="" className="size-11 rounded-2xl" /><div><p className="text-xl font-black">CampusGo</p><p className="text-[10px] font-semibold tracking-[0.1em] text-violet-500">NEARBY & TRUSTED</p></div></div>
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-card sm:p-7">
              <div><h2 className="font-display text-2xl font-black tracking-[-0.04em]">欢迎来到校园集市</h2><p className="mt-2 text-sm text-slate-500">登录后即可按学校与距离发现附近闲置。</p></div>
              <Tabs defaultValue="login" className="mt-6">
                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">登录</TabsTrigger><TabsTrigger value="register">注册认证</TabsTrigger></TabsList>
                <TabsContent value="login">
                  <form onSubmit={submitLogin} className="space-y-4">
                    <div><Label htmlFor="login-phone">手机号</Label><div className="relative"><Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="login-phone" value={loginForm.phone} onChange={(event) => setLoginForm((current) => ({ ...current, phone: event.target.value }))} className="pl-10" /></div></div>
                    <div><Label htmlFor="login-password">密码</Label><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="login-password" type={showPassword ? 'text' : 'password'} value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} className="pl-10 pr-10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
                    <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? '登录中...' : '登录'}<ArrowRight className="size-4" /></Button>
                  </form>
                  <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[11px] text-slate-400">或使用演示账号</span><span className="h-px flex-1 bg-slate-200" /></div>
                  <Button type="button" variant="outline" className="w-full" onClick={demoLogin} disabled={loading}><Sparkles className="size-4 text-violet-600" />一键进入演示环境</Button>
                  <p className="mt-3 text-center text-[11px] text-slate-400">演示账号：13800000000 / campusgo</p>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={submitRegister} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label htmlFor="reg-phone">手机号</Label><Input id="reg-phone" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} placeholder="11 位手机号" /></div>
                      <div><Label htmlFor="reg-password">密码</Label><Input id="reg-password" type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} placeholder="至少 6 位" /></div>
                    </div>
                    <div><Label htmlFor="reg-nickname">昵称</Label><div className="relative"><UserRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="reg-nickname" value={registerForm.nickname} onChange={(event) => setRegisterForm((current) => ({ ...current, nickname: event.target.value }))} className="pl-10" placeholder="同学们怎么称呼你" /></div></div>
                    <div><Label htmlFor="reg-school">学校</Label><Select id="reg-school" value={registerForm.school} onChange={(event) => setRegisterForm((current) => ({ ...current, school: event.target.value }))}><option>江城大学</option><option>江城理工大学</option><option>江城师范大学</option></Select></div>
                    <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="reg-grade">年级</Label><Select id="reg-grade" value={registerForm.grade} onChange={(event) => setRegisterForm((current) => ({ ...current, grade: event.target.value }))}><option>大一</option><option>大二</option><option>大三</option><option>大四</option><option>研究生</option></Select></div><div><Label htmlFor="reg-major">专业</Label><Input id="reg-major" value={registerForm.major} onChange={(event) => setRegisterForm((current) => ({ ...current, major: event.target.value }))} placeholder="选填" /></div></div>
                    <div className="flex items-start gap-3 rounded-2xl bg-mint-50 p-3.5 text-[11px] leading-5 text-emerald-700"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Demo 中提交即完成校园模拟认证，仅向其他用户展示学校、年级和专业。</div>
                    <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? '创建中...' : '注册并完成认证'}<GraduationCap className="size-4" /></Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-slate-400">继续即表示你同意 CampusGo 演示版使用规则。此 Demo 不接入真实支付。</p>
          </div>
        </section>
      </div>
    </div>
  )
}
