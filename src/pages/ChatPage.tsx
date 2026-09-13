import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowLeft, Check, ChevronRight, MapPin, MessageCircle, MoreHorizontal, PackageCheck, Send, ShieldCheck } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { cn, formatDateTime, formatDistance, formatPrice, formatRelativeTime } from '../lib/utils'
import type { ChatSummary, Message } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Skeleton } from '../components/ui/form'
import { EmptyState } from '../components/common/EmptyState'
import { VerifiedBadge } from '../components/common/VerifiedBadge'

export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [tradeOpen, setTradeOpen] = useState(false)
  const [meetupConfirmed, setMeetupConfirmed] = useState(false)
  const [tradeLoading, setTradeLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedChat = chats.find((chat) => chat.id === id) || null

  useEffect(() => {
    let active = true
    api.get<{ chats: ChatSummary[] }>('/chats')
      .then((response) => { if (active) setChats(response.chats) })
      .catch((error) => toast({ title: error instanceof Error ? error.message : '会话加载失败', tone: 'error' }))
      .finally(() => { if (active) setLoadingChats(false) })
    return () => { active = false }
  }, [toast])

  useEffect(() => {
    if (!id) { setMessages([]); return }
    let active = true
    setLoadingMessages(true)
    api.get<{ chat: ChatSummary; messages: Message[] }>(`/chats/${id}`)
      .then((response) => {
        if (!active) return
        setMessages(response.messages)
        setChats((items) => items.map((chat) => chat.id === response.chat.id ? response.chat : chat))
      })
      .catch((error) => toast({ title: error instanceof Error ? error.message : '消息加载失败', tone: 'error' }))
      .finally(() => { if (active) setLoadingMessages(false) })
    return () => { active = false }
  }, [id, toast])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const send = async (event?: FormEvent, quickContent?: string) => {
    event?.preventDefault()
    const text = (quickContent || content).trim()
    if (!id || !text || sending) return
    setSending(true)
    setContent('')
    try {
      const response = await api.post<{ message: Message }>(`/chats/${id}/messages`, { content: text })
      setMessages((items) => [...items, response.message])
      setChats((items) => items.map((chat) => chat.id === id ? { ...chat, lastMessage: text, lastMessageAt: response.message.createdAt } : chat))
      window.setTimeout(async () => {
        try {
          const reply = await api.post<{ message: Message }>(`/chats/${id}/simulate-reply`, { content: '可以的，我七点前都在宿舍～到楼下给我发消息就好。' })
          setMessages((items) => [...items, reply.message])
        } catch { /* non-critical */ }
      }, 850)
    } catch (error) {
      setContent(text)
      toast({ title: error instanceof Error ? error.message : '发送失败', tone: 'error' })
    } finally { setSending(false) }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() }
  }

  const completeTrade = async () => {
    if (!selectedChat || tradeLoading) return
    setTradeLoading(true)
    try {
      const response = await api.post<{ trade: { id: string } }>('/trades/complete', { productId: selectedChat.product.id })
      navigate(`/trade/${response.trade.id}/success`)
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '成交确认失败', tone: 'error' })
    } finally { setTradeLoading(false) }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card">
      <div className="grid h-[calc(100dvh-148px)] min-h-[560px] lg:h-[calc(100dvh-112px)] lg:grid-cols-[340px_1fr]">
        <aside className={cn('border-r border-slate-200 bg-slate-50/60 lg:block', id && 'hidden')}>
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div><h1 className="font-display text-lg font-black tracking-[-0.03em]">消息</h1><p className="text-[11px] text-slate-400">最近沟通与交易进度</p></div>
            <Badge variant="mint">{chats.length} 个会话</Badge>
          </div>
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-2">
            {loadingChats ? (
              <div className="space-y-2 p-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex gap-3 rounded-2xl bg-white p-3"><Skeleton className="size-12 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></div></div>)}</div>
            ) : chats.length ? chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className={cn('flex w-full gap-3 rounded-2xl p-3 text-left transition', id === chat.id ? 'bg-white shadow-sm ring-1 ring-violet-100' : 'hover:bg-white/80')}
              >
                <div className="relative shrink-0">
                  <img src={chat.otherUser.avatar} alt="" className="size-12 rounded-xl" />
                  <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-slate-50 bg-mint-400 p-1"><span className="block size-1.5 rounded-full bg-white" /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold text-slate-900">{chat.otherUser.nickname}</p><span className="shrink-0 text-[10px] text-slate-400">{formatRelativeTime(chat.lastMessageAt)}</span></div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{chat.product.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{chat.lastMessage}</p>
                </div>
              </button>
            )) : (
              <div className="p-3"><EmptyState icon={MessageCircle} title="还没有消息" description="在商品详情点击“立即咨询”，会话会出现在这里。" actionLabel="去逛附近" onAction={() => navigate('/')} /></div>
            )}
          </div>
        </aside>

        <main className={cn('min-w-0 flex-col bg-white', id ? 'flex' : 'hidden lg:flex')}>
          {!selectedChat ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-sm text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><MessageCircle className="size-7" /></div><h2 className="mt-4 text-lg font-bold">选择一个会话开始沟通</h2><p className="mt-2 text-sm leading-6 text-slate-500">先确认商品状态、交付时间和地点，再完成当面交易。</p></div>
            </div>
          ) : (
            <>
              <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-3 sm:px-5">
                <button onClick={() => navigate('/chat')} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><ArrowLeft className="size-5" /></button>
                <img src={selectedChat.otherUser.avatar} alt="" className="size-10 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-slate-900">{selectedChat.otherUser.nickname}</p>{selectedChat.otherUser.certified && <VerifiedBadge compact />}</div>
                  <p className="truncate text-[11px] text-slate-500">{selectedChat.otherUser.school} · {selectedChat.otherUser.grade}</p>
                </div>
                <Button variant="ghost" size="icon"><MoreHorizontal className="size-5" /></Button>
              </header>

              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:px-5">
                <img src={selectedChat.product.images[0]} alt="" className="size-11 rounded-xl object-cover" />
                <button onClick={() => navigate(`/product/${selectedChat.product.id}`)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-bold text-slate-800">{selectedChat.product.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500"><span className="font-bold text-coral-500">¥{formatPrice(selectedChat.product.price)}</span><span className="inline-flex items-center gap-1"><MapPin className="size-3" />{formatDistance(selectedChat.product.distanceM)}</span></p>
                </button>
                {selectedChat.product.status !== 'completed' && <Button size="sm" variant="mint" className="hidden sm:inline-flex" onClick={() => setTradeOpen(true)}><PackageCheck className="size-3.5" />确认成交</Button>}
                <ChevronRight className="size-4 text-slate-400" />
              </div>
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#F8F9FD] px-3 py-4 sm:px-5">
                <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] text-slate-500 shadow-sm"><ShieldCheck className="size-3.5 text-emerald-500" />建议在校园公共区域当面验货，避免提前转账</div>
                {loadingMessages ? (
                  <div className="space-y-4"><Skeleton className="h-14 w-3/5 rounded-2xl" /><Skeleton className="ml-auto h-14 w-2/5 rounded-2xl" /></div>
                ) : messages.map((message) => {
                  const own = message.senderId === user?.id
                  return (
                    <div key={message.id} className={cn('flex items-end gap-2', own ? 'justify-end' : 'justify-start')}>
                      {!own && <img src={selectedChat.otherUser.avatar} alt="" className="size-8 rounded-xl" />}
                      <div className={cn('max-w-[78%] sm:max-w-[65%]')}>
                        <div className={cn('rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm', own ? 'rounded-br-md bg-violet-600 text-white' : 'rounded-bl-md border border-slate-100 bg-white text-slate-700')}>{message.content}</div>
                        <p className={cn('mt-1 text-[10px] text-slate-400', own ? 'text-right' : 'text-left')}>{formatDateTime(message.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
                  {['还在吗？', '可以小刀吗？', '今晚方便交易吗？'].map((quick) => <button key={quick} onClick={() => void send(undefined, quick)} className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100">{quick}</button>)}
                </div>
                <form onSubmit={(event) => void send(event)} className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100">
                  <textarea value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={onKeyDown} rows={1} maxLength={500} placeholder="输入消息，Enter 发送..." className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400" />
                  <Button type="submit" size="icon" className="rounded-xl" disabled={!content.trim() || sending}><Send className="size-4" /></Button>
                </form>
                {selectedChat.product.status !== 'completed' && <Button variant="mint" className="mt-2 w-full sm:hidden" onClick={() => setTradeOpen(true)}><PackageCheck className="size-4" />确认完成交易</Button>}
              </div>
            </>
          )}
        </main>
      </div>

      <Dialog open={tradeOpen} onOpenChange={(open) => { setTradeOpen(open); if (!open) setMeetupConfirmed(false) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认交易已完成？</DialogTitle><DialogDescription>商品会标记为已出售，并邀请你给卖家留下真实评价。</DialogDescription></DialogHeader>
          {selectedChat && <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-3"><img src={selectedChat.product.images[0]} alt="" className="size-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{selectedChat.product.title}</p><p className="mt-1 text-xs text-slate-500">与 {selectedChat.otherUser.nickname} 交易</p></div><strong className="text-coral-500">¥{formatPrice(selectedChat.product.price)}</strong></div></div>}
          <button onClick={() => setMeetupConfirmed((value) => !value)} className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left">
            <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border', meetupConfirmed ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300')}>{meetupConfirmed && <Check className="size-3.5" />}</span>
            <span className="text-xs leading-5 text-slate-600">我们已当面验货并完成交付，确认本次交易真实完成。</span>
          </button>
          <DialogFooter><Button variant="outline" onClick={() => setTradeOpen(false)}>取消</Button><Button onClick={completeTrade} disabled={!meetupConfirmed || tradeLoading}>{tradeLoading ? '处理中...' : '完成交易'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

