import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express, { type Request, type Response } from 'express'
import { db, withTransaction } from './db.js'
import { hashPassword, verifyPassword } from './security.js'

const app: express.Express = express()
app.use(cors())
app.use(express.json({ limit: '12mb' }))

type Row = Record<string, any>
const CATEGORY_COVER: Record<string, string> = {
  教材: '/assets/products/books.svg',
  数码: '/assets/products/monitor.svg',
  宿舍用品: '/assets/products/lamp.svg',
  家具: '/assets/products/chair.svg',
  运动用品: '/assets/products/racket.svg',
  其他: '/assets/products/backpack.svg',
}

const PLACE_DISTANCE: Record<string, number> = {
  宿舍楼: 180,
  教学楼: 320,
  校门: 560,
}

function asUser(row: Row) {
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar,
    school: row.school,
    grade: row.grade,
    major: row.major,
    certified: Boolean(row.certified),
    rating: Number(row.rating),
    tradeCount: Number(row.trade_count),
    goodRate: Number(row.good_rate),
    bio: row.bio,
    createdAt: row.created_at,
  }
}

function asProduct(row: Row, isFavorite = false) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    condition: row.condition,
    usageDuration: row.usage_duration,
    tradePlace: row.trade_place,
    tradeTime: row.trade_time,
    status: row.status,
    images: JSON.parse(row.images || '[]'),
    school: row.school,
    distanceM: Number(row.distance_m),
    views: Number(row.views),
    favoriteCount: Number(row.favorite_count),
    createdAt: row.created_at,
    isFavorite,
    seller: {
      id: row.seller_id,
      nickname: row.seller_nickname,
      avatar: row.seller_avatar,
      school: row.seller_school,
      grade: row.seller_grade,
      major: row.seller_major,
      certified: Boolean(row.seller_certified),
      rating: Number(row.seller_rating),
      tradeCount: Number(row.seller_trade_count),
      goodRate: Number(row.seller_good_rate),
      bio: row.seller_bio,
    },
  }
}

const PRODUCT_SELECT = `
  SELECT p.*, u.nickname AS seller_nickname, u.avatar AS seller_avatar, u.school AS seller_school,
         u.grade AS seller_grade, u.major AS seller_major, u.certified AS seller_certified,
         u.rating AS seller_rating, u.trade_count AS seller_trade_count,
         u.good_rate AS seller_good_rate, u.bio AS seller_bio
  FROM products p JOIN users u ON u.id = p.seller_id
`

function currentUserId(req: Request) {
  const header = req.header('x-user-id')
  return header?.trim() || null
}

function getCurrentUser(req: Request): Row | null {
  const id = currentUserId(req)
  if (!id) return null
  return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row | undefined) ?? null
}

function requireUser(req: Request, res: Response): Row | null {
  const user = getCurrentUser(req)
  if (!user) {
    res.status(401).json({ message: '请先登录 CampusGo' })
    return null
  }
  return user
}

function getProductById(id: string, userId?: string | null) {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) as Row | undefined
  if (!row) return null
  const isFavorite = userId
    ? Boolean(db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?').get(userId, id))
    : false
  return asProduct(row, isFavorite)
}

function getFavoriteSet(userId?: string | null) {
  if (!userId) return new Set<string>()
  const rows = db.prepare('SELECT product_id FROM favorites WHERE user_id = ?').all(userId) as Row[]
  return new Set(rows.map((row) => String(row.product_id)))
}

function recordEvent(eventName: string, userId?: string | null, productId?: string | null, metadata: Record<string, unknown> = {}, sessionId = '') {
  db.prepare('INSERT INTO analytics (event_id, user_id, product_id, event_name, timestamp, session_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), userId || null, productId || null, eventName, new Date().toISOString(), sessionId, JSON.stringify(metadata))
}

function chatSelect() {
  return `
    SELECT c.*, p.title AS product_title, p.price AS product_price, p.images AS product_images,
           p.status AS product_status, p.distance_m AS product_distance,
           other.id AS other_id, other.nickname AS other_nickname, other.avatar AS other_avatar,
           other.school AS other_school, other.grade AS other_grade, other.certified AS other_certified,
           m.content AS last_message, m.created_at AS last_message_at
    FROM chats c
    JOIN products p ON p.id = c.product_id
    JOIN users other ON other.id = CASE WHEN c.buyer_id = ? THEN c.seller_id ELSE c.buyer_id END
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
    )
  `
}

function asChat(row: Row) {
  return {
    id: row.id,
    product: {
      id: row.product_id,
      title: row.product_title,
      price: Number(row.product_price),
      images: JSON.parse(row.product_images || '[]'),
      status: row.product_status,
      distanceM: Number(row.product_distance),
    },
    otherUser: {
      id: row.other_id,
      nickname: row.other_nickname,
      avatar: row.other_avatar,
      school: row.other_school,
      grade: row.other_grade,
      certified: Boolean(row.other_certified),
    },
    lastMessage: row.last_message || '开始聊聊这笔交易吧',
    lastMessageAt: row.last_message_at || row.updated_at,
    updatedAt: row.updated_at,
  }
}

function getChat(chatId: string, userId: string) {
  const row = db.prepare(`${chatSelect()} WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)`).get(userId, chatId, userId, userId) as Row | undefined
  return row ? asChat(row) : null
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'CampusGo API', time: new Date().toISOString() })
})

app.post('/api/auth/demo', (_req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get('u_demo') as Row
  res.json({ user: asUser(user) })
})

app.post('/api/auth/login', (req, res) => {
  const phone = String(req.body.phone || '').trim()
  const password = String(req.body.password || '')
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as Row | undefined
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ message: '手机号或密码不正确' })
    return
  }
  res.json({ user: asUser(user) })
})

app.post('/api/auth/register', (req, res) => {
  const phone = String(req.body.phone || '').trim()
  const password = String(req.body.password || '')
  const nickname = String(req.body.nickname || '').trim()
  const school = String(req.body.school || '').trim()
  const grade = String(req.body.grade || '').trim()
  const major = String(req.body.major || '').trim()
  if (!/^1\d{10}$/.test(phone)) {
    res.status(400).json({ message: '请输入 11 位手机号' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ message: '密码至少需要 6 位' })
    return
  }
  if (!nickname || !school || !grade) {
    res.status(400).json({ message: '请完整填写昵称与校园信息' })
    return
  }
  const existed = db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone)
  if (existed) {
    res.status(409).json({ message: '该手机号已注册，请直接登录' })
    return
  }
  const id = `u_${randomUUID()}`
  const avatar = '/assets/avatar-new.svg'
  db.prepare(`
    INSERT INTO users (id, phone, password_hash, nickname, avatar, school, grade, major, certified, rating, trade_count, good_rate, bio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 5, 0, 100, ?, ?)
  `).run(id, phone, hashPassword(password), nickname, avatar, school, grade, major, '刚刚加入 CampusGo', new Date().toISOString())
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row
  res.status(201).json({ user: asUser(user) })
})

app.post('/api/auth/certify', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const school = String(req.body.school || '').trim()
  const grade = String(req.body.grade || '').trim()
  const major = String(req.body.major || '').trim()
  if (!school || !grade) {
    res.status(400).json({ message: '请选择学校和年级' })
    return
  }
  db.prepare('UPDATE users SET school = ?, grade = ?, major = ?, certified = 1 WHERE id = ?').run(school, grade, major, user.id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as Row
  res.json({ user: asUser(updated) })
})

app.get('/api/me', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  res.json({ user: asUser(user) })
})

app.get('/api/products', (req, res) => {
  const userId = currentUserId(req)
  const user = getCurrentUser(req)
  const q = String(req.query.q || '').trim()
  const category = String(req.query.category || '').trim()
  const maxPrice = Number(req.query.maxPrice || 0)
  const maxDistance = Number(req.query.maxDistance || 0)
  const sort = String(req.query.sort || 'recommended')
  const includeSold = String(req.query.includeSold || '') === '1'
  const conditions: string[] = []
  const params: any[] = []

  if (!includeSold) conditions.push("p.status != 'completed'")
  if (q) {
    conditions.push('(p.title LIKE ? OR p.description LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }
  if (category && category !== '全部') {
    conditions.push('p.category = ?')
    params.push(category)
  }
  if (maxPrice > 0) {
    conditions.push('p.price <= ?')
    params.push(maxPrice)
  }
  if (maxDistance > 0) {
    conditions.push('p.distance_m <= ?')
    params.push(maxDistance)
  }

  let orderBy = 'p.created_at DESC'
  if (sort === 'recommended') {
    orderBy = 'CASE WHEN p.school = ? THEN 0 ELSE 1 END, CASE WHEN p.status = \'available\' THEN 0 ELSE 1 END, p.distance_m ASC, p.created_at DESC'
    params.push(user?.school || '江城大学')
  } else if (sort === 'distance') {
    orderBy = 'p.distance_m ASC, p.created_at DESC'
  } else if (sort === 'price_asc') {
    orderBy = 'p.price ASC, p.created_at DESC'
  } else if (sort === 'price_desc') {
    orderBy = 'p.price DESC, p.created_at DESC'
  } else if (sort === 'newest') {
    orderBy = 'p.created_at DESC'
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(`${PRODUCT_SELECT} ${where} ORDER BY ${orderBy} LIMIT 60`).all(...params) as Row[]
  const favorites = getFavoriteSet(userId)
  res.json({ products: rows.map((row) => asProduct(row, favorites.has(String(row.id)))) })
})

app.get('/api/products/:id', (req, res) => {
  const userId = currentUserId(req)
  const product = getProductById(req.params.id, userId)
  if (!product) {
    res.status(404).json({ message: '商品不存在或已下架' })
    return
  }

  if (String(req.query.track || '') === '1') {
    db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(req.params.id)
    product.views += 1
  }

  const relatedRows = db.prepare(`${PRODUCT_SELECT} WHERE p.id != ? AND p.status != 'completed' AND (p.category = ? OR p.school = ?) ORDER BY CASE WHEN p.category = ? THEN 0 ELSE 1 END, p.distance_m ASC LIMIT 4`)
    .all(req.params.id, product.category, product.school, product.category) as Row[]
  const favorites = getFavoriteSet(userId)
  res.json({
    product,
    related: relatedRows.map((row) => asProduct(row, favorites.has(String(row.id)))),
  })
})

app.post('/api/products', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const title = String(req.body.title || '').trim()
  const description = String(req.body.description || '').trim()
  const category = String(req.body.category || '').trim()
  const price = Number(req.body.price)
  const originalPrice = Number(req.body.originalPrice)
  const condition = String(req.body.condition || '9成新').trim()
  const usageDuration = String(req.body.usageDuration || '未填写').trim()
  const tradePlace = String(req.body.tradePlace || '').trim()
  const tradeTime = String(req.body.tradeTime || '').trim()
  const placeType = String(req.body.placeType || '宿舍楼')
  const images = Array.isArray(req.body.images) && req.body.images.length
    ? req.body.images.slice(0, 4)
    : [CATEGORY_COVER[category] || CATEGORY_COVER.其他]

  if (!title || title.length > 60 || !description || !category || !tradePlace || !tradeTime) {
    res.status(400).json({ message: '请完整填写商品与交易信息' })
    return
  }
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(originalPrice) || originalPrice <= 0) {
    res.status(400).json({ message: '请输入有效的价格' })
    return
  }

  const id = `p_${randomUUID()}`
  const distanceM = PLACE_DISTANCE[placeType] || 300
  db.prepare(`
    INSERT INTO products (id, title, description, category, price, original_price, condition, usage_duration, trade_place, trade_time, status, images, school, distance_m, seller_id, views, favorite_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, 0, 0, ?)
  `).run(id, title, description, category, price, originalPrice, condition, usageDuration, tradePlace, tradeTime, JSON.stringify(images), user.school, distanceM, user.id, new Date().toISOString())

  recordEvent('publish_product', user.id, id, { category, price, school: user.school }, String(req.body.sessionId || ''))
  res.status(201).json({ product: getProductById(id, user.id) })
})

app.patch('/api/products/:id/status', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const status = String(req.body.status || '')
  if (!['available', 'reserved', 'completed'].includes(status)) {
    res.status(400).json({ message: '无效的商品状态' })
    return
  }
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as Row | undefined
  if (!product || product.seller_id !== user.id) {
    res.status(404).json({ message: '未找到可管理的商品' })
    return
  }

  withTransaction(() => {
    db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, req.params.id)
    if (status === 'completed') {
      const existing = db.prepare('SELECT id FROM trades WHERE product_id = ?').get(req.params.id)
      if (!existing) {
        db.prepare('INSERT INTO trades (id, product_id, buyer_id, seller_id, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(randomUUID(), req.params.id, user.id, user.id, 'completed', new Date().toISOString(), new Date().toISOString())
      }
    }
  })
  res.json({ product: getProductById(req.params.id, user.id) })
})

app.post('/api/favorites/:productId', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.productId) as Row | undefined
  if (!product) {
    res.status(404).json({ message: '商品不存在' })
    return
  }
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(user.id, req.params.productId) as Row | undefined
  if (existing) {
    withTransaction(() => {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
      db.prepare('UPDATE products SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?').run(req.params.productId)
    })
    res.json({ favorite: false, message: '已取消收藏' })
    return
  }
  withTransaction(() => {
    db.prepare('INSERT INTO favorites (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)').run(randomUUID(), user.id, req.params.productId, new Date().toISOString())
    db.prepare('UPDATE products SET favorite_count = favorite_count + 1 WHERE id = ?').run(req.params.productId)
  })
  res.json({ favorite: true, message: '已收藏，有状态变化会提醒你' })
})

app.get('/api/favorites', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const rows = db.prepare(`${PRODUCT_SELECT} JOIN favorites f ON f.product_id = p.id WHERE f.user_id = ? ORDER BY f.created_at DESC`).all(user.id) as Row[]
  res.json({ products: rows.map((row) => asProduct(row, true)) })
})

app.get('/api/me/products', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const rows = db.prepare(`${PRODUCT_SELECT} WHERE p.seller_id = ? ORDER BY p.created_at DESC`).all(user.id) as Row[]
  const favorites = getFavoriteSet(user.id)
  res.json({ products: rows.map((row) => asProduct(row, favorites.has(String(row.id)))) })
})

app.get('/api/chats', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const rows = db.prepare(`${chatSelect()} WHERE c.buyer_id = ? OR c.seller_id = ? ORDER BY COALESCE(m.created_at, c.updated_at) DESC`).all(user.id, user.id, user.id) as Row[]
  res.json({ chats: rows.map(asChat) })
})

app.post('/api/chats', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const productId = String(req.body.productId || '')
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Row | undefined
  if (!product) {
    res.status(404).json({ message: '商品不存在' })
    return
  }
  if (product.seller_id === user.id) {
    res.status(400).json({ message: '这是你发布的商品，无需联系自己' })
    return
  }

  let chat = db.prepare('SELECT id FROM chats WHERE product_id = ? AND buyer_id = ?').get(productId, user.id) as Row | undefined
  if (!chat) {
    const chatId = `chat_${randomUUID()}`
    withTransaction(() => {
      db.prepare('INSERT INTO chats (id, product_id, buyer_id, seller_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(chatId, productId, user.id, product.seller_id, new Date().toISOString(), new Date().toISOString())
      db.prepare('INSERT INTO messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), chatId, user.id, '你好，请问还可以交易吗？', new Date().toISOString())
      db.prepare('INSERT INTO messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), chatId, product.seller_id, '可以的，晚上 7 点宿舍楼下见。', new Date(Date.now() + 800).toISOString())
    })
    chat = { id: chatId }
  }

  recordEvent('click_chat', user.id, productId, { source: String(req.body.source || 'product_detail') }, String(req.body.sessionId || ''))
  res.status(201).json({ chat: getChat(String(chat.id), user.id) })
})

app.get('/api/chats/:id', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const chat = getChat(req.params.id, user.id)
  if (!chat) {
    res.status(404).json({ message: '会话不存在' })
    return
  }
  const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC').all(req.params.id) as Row[]
  res.json({
    chat,
    messages: messages.map((message) => ({
      id: message.id,
      chatId: message.chat_id,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at,
    })),
  })
})

app.post('/api/chats/:id/messages', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const chat = getChat(req.params.id, user.id)
  if (!chat) {
    res.status(404).json({ message: '会话不存在' })
    return
  }
  const content = String(req.body.content || '').trim()
  if (!content || content.length > 500) {
    res.status(400).json({ message: '请输入 1-500 字的消息' })
    return
  }
  const id = randomUUID()
  db.prepare('INSERT INTO messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, user.id, content, new Date().toISOString())
  db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)
  recordEvent('send_message', user.id, chat.product.id, { chatId: req.params.id, length: content.length }, String(req.body.sessionId || ''))
  res.status(201).json({
    message: { id, chatId: req.params.id, senderId: user.id, content, createdAt: new Date().toISOString() },
  })
})

app.post('/api/chats/:id/simulate-reply', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const chat = getChat(req.params.id, user.id)
  if (!chat) {
    res.status(404).json({ message: '会话不存在' })
    return
  }
  const sellerId = (db.prepare('SELECT seller_id FROM chats WHERE id = ?').get(req.params.id) as Row).seller_id
  const content = String(req.body.content || '收到，我再看下时间，稍后回复你～').slice(0, 120)
  const id = randomUUID()
  db.prepare('INSERT INTO messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, sellerId, content, new Date().toISOString())
  db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)
  res.status(201).json({ message: { id, chatId: req.params.id, senderId: sellerId, content, createdAt: new Date().toISOString() } })
})

app.post('/api/trades/complete', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const productId = String(req.body.productId || '')
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Row | undefined
  if (!product) {
    res.status(404).json({ message: '商品不存在' })
    return
  }
  if (product.seller_id === user.id) {
    res.status(400).json({ message: '卖家不能购买自己的商品' })
    return
  }
  if (product.status === 'completed') {
    res.status(409).json({ message: '该商品已完成交易' })
    return
  }

  const tradeId = `trade_${randomUUID()}`
  withTransaction(() => {
    db.prepare('INSERT INTO trades (id, product_id, buyer_id, seller_id, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(tradeId, productId, user.id, product.seller_id, 'completed', new Date().toISOString(), new Date().toISOString())
    db.prepare("UPDATE products SET status = 'completed' WHERE id = ?").run(productId)
    db.prepare('UPDATE users SET trade_count = trade_count + 1 WHERE id = ?').run(product.seller_id)
    recordEvent('complete_trade', user.id, productId, { tradeId, amount: product.price, school: product.school }, String(req.body.sessionId || ''))
  })

  res.status(201).json({ trade: getTradeById(tradeId, user.id) })
})

function getTradeById(tradeId: string, userId: string) {
  const row = db.prepare(`
    SELECT t.*, p.title AS product_title, p.price AS product_price, p.images AS product_images,
           p.school AS product_school, p.trade_place, p.trade_time,
           seller.nickname AS seller_nickname, seller.avatar AS seller_avatar, seller.school AS seller_school,
           buyer.nickname AS buyer_nickname, buyer.avatar AS buyer_avatar, buyer.school AS buyer_school
    FROM trades t
    JOIN products p ON p.id = t.product_id
    JOIN users seller ON seller.id = t.seller_id
    JOIN users buyer ON buyer.id = t.buyer_id
    WHERE t.id = ? AND (t.buyer_id = ? OR t.seller_id = ?)
  `).get(tradeId, userId, userId) as Row | undefined
  if (!row) return null
  return {
    id: row.id,
    product: {
      id: row.product_id,
      title: row.product_title,
      price: Number(row.product_price),
      images: JSON.parse(row.product_images || '[]'),
      school: row.product_school,
      tradePlace: row.trade_place,
      tradeTime: row.trade_time,
    },
    buyer: { id: row.buyer_id, nickname: row.buyer_nickname, avatar: row.buyer_avatar, school: row.buyer_school },
    seller: { id: row.seller_id, nickname: row.seller_nickname, avatar: row.seller_avatar, school: row.seller_school },
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

app.get('/api/trades', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const rows = db.prepare('SELECT id FROM trades WHERE buyer_id = ? OR seller_id = ? ORDER BY COALESCE(completed_at, created_at) DESC').all(user.id, user.id) as Row[]
  res.json({ trades: rows.map((row) => getTradeById(String(row.id), user.id)).filter(Boolean) })
})

app.get('/api/trades/:id', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const trade = getTradeById(req.params.id, user.id)
  if (!trade) {
    res.status(404).json({ message: '交易记录不存在' })
    return
  }
  const review = db.prepare('SELECT * FROM reviews WHERE trade_id = ? AND reviewer_id = ?').get(req.params.id, user.id) as Row | undefined
  res.json({ trade, review: review ? { id: review.id, rating: review.rating, content: review.content, tags: JSON.parse(review.tags || '[]') } : null })
})

app.post('/api/trades/:id/review', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND buyer_id = ?').get(req.params.id, user.id) as Row | undefined
  if (!trade) {
    res.status(404).json({ message: '未找到可评价的交易' })
    return
  }
  const existing = db.prepare('SELECT id FROM reviews WHERE trade_id = ? AND reviewer_id = ?').get(req.params.id, user.id)
  if (existing) {
    res.status(409).json({ message: '这笔交易已经评价过了' })
    return
  }
  const rating = Math.max(1, Math.min(5, Number(req.body.rating || 5)))
  const content = String(req.body.content || '').trim().slice(0, 300)
  const tags = Array.isArray(req.body.tags) ? req.body.tags.slice(0, 6) : []
  const id = randomUUID()
  withTransaction(() => {
    db.prepare('INSERT INTO reviews (id, trade_id, reviewer_id, reviewee_id, rating, content, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.params.id, user.id, trade.seller_id, rating, content, JSON.stringify(tags), new Date().toISOString())
    const aggregate = db.prepare('SELECT AVG(rating) AS rating, AVG(CASE WHEN rating >= 4 THEN 100.0 ELSE 40.0 END) AS good_rate FROM reviews WHERE reviewee_id = ?').get(trade.seller_id) as Row
    db.prepare('UPDATE users SET rating = ?, good_rate = ? WHERE id = ?')
      .run(Number(aggregate.rating || rating), Number(aggregate.good_rate || 100), trade.seller_id)
  })
  res.status(201).json({ ok: true, message: '评价已提交，感谢你的真实反馈' })
})

app.post('/api/analytics/events', (req, res) => {
  const user = getCurrentUser(req)
  const input = Array.isArray(req.body.events) ? req.body.events : [req.body]
  let inserted = 0
  for (const event of input.slice(0, 100)) {
    const eventName = String(event?.eventName || '').trim()
    if (!/^[a-z_]{3,50}$/.test(eventName)) continue
    recordEvent(
      eventName,
      user?.id || event.userId || null,
      event.productId || null,
      typeof event.metadata === 'object' && event.metadata ? event.metadata : {},
      String(event.sessionId || req.body.sessionId || ''),
    )
    inserted += 1
  }
  res.status(201).json({ ok: true, inserted })
})

app.get('/api/analytics/dashboard', (req, res) => {
  const days = Math.max(1, Math.min(30, Number(req.query.days || 7)))
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  const startIso = start.toISOString()
  const today = new Date().toISOString().slice(0, 10)

  const eventRows = db.prepare(`
    SELECT event_name, COUNT(*) AS count
    FROM analytics WHERE timestamp >= ? GROUP BY event_name
  `).all(startIso) as Row[]
  const eventMap = Object.fromEntries(eventRows.map((row) => [row.event_name, Number(row.count)]))
  const exposure = eventMap.expose_product || 0
  const clicks = eventMap.click_product || 0
  const chats = eventMap.click_chat || 0
  const trades = eventMap.complete_trade || 0

  const published = (db.prepare('SELECT COUNT(*) AS count FROM products WHERE created_at >= ?').get(startIso) as Row).count
  const dau = (db.prepare("SELECT COUNT(DISTINCT user_id) AS count FROM analytics WHERE substr(timestamp, 1, 10) = ? AND user_id IS NOT NULL").get(today) as Row).count
  const gmvRows = db.prepare('SELECT metadata FROM analytics WHERE event_name = ? AND timestamp >= ?').all('complete_trade', startIso) as Row[]
  const gmv = gmvRows.reduce((total, row) => total + Number(JSON.parse(row.metadata || '{}').amount || 0), 0)

  const trend: Array<Record<string, unknown>> = []
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const key = date.toISOString().slice(0, 10)
    const rows = db.prepare(`
      SELECT event_name, COUNT(*) AS count FROM analytics
      WHERE substr(timestamp, 1, 10) = ? GROUP BY event_name
    `).all(key) as Row[]
    const map = Object.fromEntries(rows.map((row) => [row.event_name, Number(row.count)]))
    trend.push({
      date: key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      exposure: map.expose_product || 0,
      clicks: map.click_product || 0,
      chats: map.click_chat || 0,
      trades: map.complete_trade || 0,
      published: (db.prepare('SELECT COUNT(*) AS count FROM products WHERE substr(created_at, 1, 10) = ?').get(key) as Row).count,
    })
  }

  const recentEvents = db.prepare(`
    SELECT a.*, p.title AS product_title, u.nickname AS user_nickname
    FROM analytics a
    LEFT JOIN products p ON p.id = a.product_id
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.timestamp DESC LIMIT 14
  `).all() as Row[]

  const topProducts = db.prepare(`
    SELECT p.id, p.title, p.price, p.images, COUNT(a.event_id) AS clicks
    FROM analytics a JOIN products p ON p.id = a.product_id
    WHERE a.event_name = 'click_product' AND a.timestamp >= ?
    GROUP BY p.id ORDER BY clicks DESC LIMIT 5
  `).all(startIso) as Row[]

  const categoryRows = db.prepare(`
    SELECT category, COUNT(*) AS count FROM products WHERE status != 'completed' GROUP BY category ORDER BY count DESC
  `).all() as Row[]

  res.json({
    range: { days, from: startIso, to: new Date().toISOString() },
    metrics: {
      dau: Number(dau),
      published: Number(published),
      productViews: clicks,
      chats,
      trades,
      gmv: Number(gmv),
      exposure,
    },
    funnel: {
      exposure,
      clicks,
      chats,
      trades,
      clickRate: exposure ? clicks / exposure : 0,
      consultRate: clicks ? chats / clicks : 0,
      tradeRate: chats ? trades / chats : 0,
      overallRate: exposure ? trades / exposure : 0,
    },
    trend,
    topProducts: topProducts.map((row) => ({
      id: row.id,
      title: row.title,
      price: Number(row.price),
      image: JSON.parse(row.images || '[]')[0],
      clicks: Number(row.clicks),
    })),
    categories: categoryRows.map((row) => ({ category: row.category, count: Number(row.count) })),
    recentEvents: recentEvents.map((row) => ({
      id: row.event_id,
      eventName: row.event_name,
      userId: row.user_id,
      userNickname: row.user_nickname || '匿名访客',
      productId: row.product_id,
      productTitle: row.product_title,
      timestamp: row.timestamp,
      metadata: JSON.parse(row.metadata || '{}'),
    })),
  })
})

app.post('/api/valuation', (req, res) => {
  const category = String(req.body.category || '其他')
  const originalPrice = Math.max(1, Number(req.body.originalPrice || 0))
  const condition = String(req.body.condition || '9成新')
  const usageMonths = Math.max(0, Number(req.body.usageMonths || 0))
  const categoryRate: Record<string, number> = {
    数码: 0.62,
    教材: 0.38,
    宿舍用品: 0.5,
    家具: 0.46,
    运动用品: 0.52,
    其他: 0.45,
  }
  const conditionRate: Record<string, number> = {
    '全新': 0.96,
    '9成新': 0.84,
    '8成新': 0.7,
    '7成新': 0.56,
    '有使用痕迹': 0.4,
  }
  const usageRate = Math.max(0.68, 1 - Math.min(36, usageMonths) * 0.008)
  const base = originalPrice * (categoryRate[category] || 0.48) * (conditionRate[condition] || 0.78) * usageRate
  const low = Math.max(1, Math.round((base * 0.9) / 5) * 5)
  const high = Math.max(low + 5, Math.round((base * 1.08) / 5) * 5)
  const suggested = Math.round((low + high) / 10) * 5
  const confidence = originalPrice > 0 && usageMonths > 0 ? 86 : 72
  const reasons = [
    `同类${category}近期成交约为原价的 ${Math.round((base / originalPrice) * 100)}%`,
    `${condition}折价为 ${Math.round((conditionRate[condition] || 0.78) * 100)}%`,
    usageMonths > 18 ? '使用时间较长，价格已考虑折旧' : '校园自提可省去物流成本',
  ]
  res.json({ low, high, suggested, confidence, reasons })
})


app.get('/api/setup/github', (_req, res) => {
  res.type('html').send(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CampusGo GitHub Setup</title><style>body{font-family:system-ui,sans-serif;background:#f5f6fb;margin:0;display:grid;place-items:center;min-height:100vh;color:#111827}.card{width:min(560px,calc(100% - 32px));background:#fff;border:1px solid #e5e7eb;border-radius:24px;padding:28px;box-shadow:0 20px 50px rgba(31,41,55,.08)}h1{margin:0 0 12px}p{color:#64748b;line-height:1.7}.code{font-size:28px;font-weight:800;letter-spacing:.12em;color:#5e46f0;margin:16px 0}.status{white-space:pre-wrap;background:#f8fafc;border-radius:14px;padding:14px;margin-top:16px;color:#475569}button{border:0;background:#5e46f0;color:#fff;border-radius:12px;padding:12px 18px;font-weight:700;cursor:pointer}a{color:#5e46f0}</style></head><body><div class="card"><h1>GitHub 仓库初始化</h1><p>点击下方按钮生成一次性设备授权码，然后在 GitHub 完成授权。授权完成后，本页面会自动创建公开仓库并返回链接。</p><button id="start">开始 GitHub 授权</button><div id="status" class="status">尚未开始</div></div><script>const statusEl=document.getElementById('status');const start=document.getElementById('start');async function poll(deviceCode){try{const r=await fetch('/api/setup/github/complete',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceCode})});const d=await r.json();if(d.status==='pending'){statusEl.innerHTML='<div class="code">'+localStorage.getItem('campusgo_user_code')+'</div>等待 GitHub 授权中...';setTimeout(()=>poll(deviceCode),d.interval||6000);return}if(d.repoUrl){statusEl.innerHTML='公开仓库已创建：<a href="'+d.repoUrl+'" target="_blank">'+d.repoUrl+'</a>';return}statusEl.textContent=d.message||'初始化失败';}catch(e){statusEl.textContent='轮询暂时中断，5 秒后重试...';setTimeout(()=>poll(deviceCode),5000)}}start.onclick=async()=>{start.disabled=true;statusEl.textContent='正在申请授权码...';const r=await fetch('/api/setup/github/device',{method:'POST'});const d=await r.json();if(!d.userCode){statusEl.textContent=d.message||'无法生成授权码';start.disabled=false;return}localStorage.setItem('campusgo_device_code',d.deviceCode);localStorage.setItem('campusgo_user_code',d.userCode);statusEl.innerHTML='请打开 <a href="'+d.verificationUri+'" target="_blank">'+d.verificationUri+'</a><div class="code">'+d.userCode+'</div>输入上方代码并授权。';window.open(d.verificationUri,'_blank');poll(d.deviceCode);};</script></body></html>`)
})

app.post('/api/setup/github/device', async (_req, res) => {
  try {
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'CampusGo-Setup' },
      body: JSON.stringify({ client_id: '178c6fc778ccc68e1d6a', scope: 'public_repo read:user' }),
    })
    const data = await response.json() as Record<string, any>
    res.json({ deviceCode: data.device_code, userCode: data.user_code, verificationUri: data.verification_uri, expiresIn: data.expires_in, interval: data.interval })
  } catch {
    res.status(502).json({ message: '无法连接 GitHub 设备授权服务' })
  }
})

app.post('/api/setup/github/complete', async (req, res) => {
  const deviceCode = String(req.body.deviceCode || '')
  if (!deviceCode) { res.status(400).json({ message: '缺少 deviceCode' }); return }
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'CampusGo-Setup' },
      body: JSON.stringify({ client_id: '178c6fc778ccc68e1d6a', device_code: deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }),
    })
    const tokenData = await tokenResponse.json() as Record<string, any>
    if (tokenData.error === 'authorization_pending' || tokenData.error === 'slow_down') { res.status(202).json({ status: 'pending', interval: tokenData.error === 'slow_down' ? 7000 : 5000 }); return }
    if (!tokenData.access_token) { res.status(400).json({ message: tokenData.error_description || tokenData.error || 'GitHub 授权未完成' }); return }

    const repoResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'CampusGo-Setup', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'campusgo', description: 'CampusGo campus second-hand marketplace MVP', private: false, has_issues: true, has_projects: false, has_wiki: false }),
    })
    const repoData = await repoResponse.json() as Record<string, any>
    if (repoResponse.ok) { res.json({ status: 'created', repoUrl: repoData.html_url, cloneUrl: repoData.clone_url }); return }
    if (repoResponse.status === 422) {
      const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'CampusGo-Setup' } })
      const user = await userResponse.json() as Record<string, any>
      res.json({ status: 'created', repoUrl: `https://github.com/${user.login}/campusgo`, cloneUrl: `https://github.com/${user.login}/campusgo.git` })
      return
    }
    res.status(400).json({ message: repoData.message || '创建 GitHub 仓库失败' })
  } catch {
    res.status(502).json({ message: '验证 GitHub 授权时发生错误' })
  }
})

app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error(error)
  res.status(500).json({ message: '服务开小差了，请稍后重试' })
})

export default app

