export type ProductStatus = 'available' | 'reserved' | 'completed'

export interface User {
  id: string
  phone?: string
  nickname: string
  avatar: string
  school: string
  grade: string
  major: string
  certified: boolean
  rating: number
  tradeCount: number
  goodRate: number
  bio: string
  createdAt?: string
}

export interface Product {
  id: string
  title: string
  description: string
  category: string
  price: number
  originalPrice: number
  condition: string
  usageDuration: string
  tradePlace: string
  tradeTime: string
  status: ProductStatus
  images: string[]
  school: string
  distanceM: number
  views: number
  favoriteCount: number
  createdAt: string
  isFavorite: boolean
  seller: Partial<User> & { id: string; nickname: string }
}

export interface ChatSummary {
  id: string
  product: Pick<Product, 'id' | 'title' | 'price' | 'images' | 'status' | 'distanceM'>
  otherUser: Pick<User, 'id' | 'nickname' | 'avatar' | 'school' | 'grade' | 'certified'>
  lastMessage: string
  lastMessageAt: string
  updatedAt: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  createdAt: string
}

export interface Trade {
  id: string
  product: Pick<Product, 'id' | 'title' | 'price' | 'images' | 'school' | 'tradePlace' | 'tradeTime'>
  buyer: Pick<User, 'id' | 'nickname' | 'avatar' | 'school'>
  seller: Pick<User, 'id' | 'nickname' | 'avatar' | 'school'>
  status: string
  createdAt: string
  completedAt: string
}

export type AnalyticsEventName =
  | 'view_home'
  | 'expose_product'
  | 'click_product'
  | 'click_publish'
  | 'publish_product'
  | 'publish_product_success'
  | 'click_chat'
  | 'send_message'
  | 'complete_trade'
  | 'favorite_product'

export interface DashboardData {
  range: { days: number; from: string; to: string }
  metrics: {
    dau: number
    published: number
    productViews: number
    chats: number
    trades: number
    gmv: number
    exposure: number
  }
  funnel: {
    exposure: number
    clicks: number
    chats: number
    trades: number
    clickRate: number
    consultRate: number
    tradeRate: number
    overallRate: number
  }
  trend: Array<{
    date: string
    label: string
    exposure: number
    clicks: number
    chats: number
    trades: number
    published: number
  }>
  topProducts: Array<{ id: string; title: string; price: number; image: string; clicks: number }>
  categories: Array<{ category: string; count: number }>
  recentEvents: Array<{
    id: string
    eventName: string
    userId?: string
    userNickname: string
    productId?: string
    productTitle?: string
    timestamp: string
    metadata: Record<string, unknown>
  }>
}
