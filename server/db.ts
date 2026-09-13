import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { hashPassword } from './security.js'

const dataDir = process.env.VERCEL ? path.join('/tmp', 'campusgo-data') : path.join(process.cwd(), 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(path.join(dataDir, 'campusgo.db'))
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

export function withTransaction<T>(work: () => T): T {
  db.exec('BEGIN')
  try {
    const result = work()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT NOT NULL,
      school TEXT NOT NULL,
      grade TEXT NOT NULL,
      major TEXT NOT NULL DEFAULT '',
      certified INTEGER NOT NULL DEFAULT 1,
      rating REAL NOT NULL DEFAULT 5,
      trade_count INTEGER NOT NULL DEFAULT 0,
      good_rate REAL NOT NULL DEFAULT 100,
      bio TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      condition TEXT NOT NULL,
      usage_duration TEXT NOT NULL DEFAULT '未填写',
      trade_place TEXT NOT NULL,
      trade_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      images TEXT NOT NULL DEFAULT '[]',
      school TEXT NOT NULL,
      distance_m INTEGER NOT NULL DEFAULT 500,
      seller_id TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      favorite_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(product_id, buyer_id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      trade_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (trade_id) REFERENCES trades(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS analytics (
      event_id TEXT PRIMARY KEY,
      user_id TEXT,
      product_id TEXT,
      event_name TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      session_id TEXT,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics(event_name, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_chats_member ON chats(buyer_id, seller_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at ASC);
  `)
}

const nowIso = () => new Date().toISOString()
const agoHours = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const agoDays = (days: number, hour = 19, minute = 30) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (existing.count > 0) return

  const demoPassword = hashPassword('campusgo')
  const users = [
    ['u_demo', '13800000000', '林小满', '/assets/avatar-lin.svg', '江城大学', '大四', '新闻传播', 1, 4.9, 18, 98, '毕业前，把还能发光的东西交给需要它的人。', agoDays(180, 10, 0)],
    ['u_seller_1', '13800000001', '周然', '/assets/avatar-zhou.svg', '江城大学', '大三', '计算机科学', 1, 4.8, 26, 97, '数码爱好者，基本秒回。', agoDays(220, 9, 10)],
    ['u_seller_2', '13800000002', '陈屿', '/assets/avatar-chen.svg', '江城大学', '研一', '工业设计', 1, 5.0, 11, 100, '东西都维护得很好，欢迎校内自提。', agoDays(150, 11, 20)],
    ['u_seller_3', '13800000003', '苏晴', '/assets/avatar-su.svg', '江城大学', '大四', '英语', 1, 4.9, 21, 99, '毕业清仓，价格都可以小刀。', agoDays(200, 13, 40)],
    ['u_seller_4', '13800000004', '贺川', '/assets/avatar-he.svg', '江城理工大学', '大二', '机械工程', 1, 4.7, 8, 96, '主要在理工大南门交易。', agoDays(120, 15, 10)],
    ['u_seller_5', '13800000005', '林楠', '/assets/avatar-nan.svg', '江城大学', '大二', '建筑学', 1, 4.9, 15, 100, '喜欢整理，也会认真打包。', agoDays(100, 16, 0)],
  ]

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, password_hash, nickname, avatar, school, grade, major, certified, rating, trade_count, good_rate, bio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const user of users) insertUser.run(user[0], user[1], demoPassword, ...user.slice(2))

  const products = [
    {
      id: 'p_ipad_air5', title: 'iPad Air 5 64G 深空灰', description: '自用学习平板，屏幕无划痕，电池健康 91%。配原装充电器和磁吸保护壳，图书馆当面验机。', category: '数码', price: 2800, originalPrice: 4399, condition: '9成新', usageDuration: '使用 1 年 2 个月', tradePlace: '女生宿舍3号楼', tradeTime: '今晚 19:00-21:00', status: 'available', images: ['/assets/products/ipad.svg'], school: '江城大学', distanceM: 300, sellerId: 'u_seller_1', views: 328, favoriteCount: 41, createdAt: agoHours(2),
    },
    { id: 'p_lamp', title: '宿舍静音小台灯', description: '三档色温，亮度可调，晚上赶论文不打扰室友。搬宿舍不方便带走。', category: '宿舍用品', price: 28, originalPrice: 79, condition: '9成新', usageDuration: '使用 8 个月', tradePlace: '女生宿舍5号楼', tradeTime: '每天 18:00 后', status: 'available', images: ['/assets/products/lamp.svg'], school: '江城大学', distanceM: 180, sellerId: 'u_seller_3', views: 146, favoriteCount: 19, createdAt: agoHours(4) },
    { id: 'p_fridge', title: '海尔 92L 宿舍小冰箱', description: '制冷正常，无异味，适合放饮料和面膜。毕业出，可帮忙一起搬到楼下。', category: '宿舍用品', price: 360, originalPrice: 799, condition: '8成新', usageDuration: '使用 2 年', tradePlace: '女生宿舍3号楼', tradeTime: '本周六下午', status: 'available', images: ['/assets/products/fridge.svg'], school: '江城大学', distanceM: 120, sellerId: 'u_seller_3', views: 501, favoriteCount: 63, createdAt: agoHours(7) },
    { id: 'p_bike', title: '捷安特通勤自行车', description: '刚做过保养，刹车灵敏，车锁一起送。适合宿舍到教学楼通勤。', category: '运动用品', price: 480, originalPrice: 1599, condition: '8成新', usageDuration: '使用 2 年半', tradePlace: '东校门', tradeTime: '周末全天', status: 'reserved', images: ['/assets/products/bike.svg'], school: '江城大学', distanceM: 450, sellerId: 'u_demo', views: 287, favoriteCount: 35, createdAt: agoHours(11) },
    { id: 'p_books', title: '考研数学复习全书 全套', description: '2025 版，笔记写在便签上，可撕掉。赠送英语真题和答题卡。', category: '教材', price: 35, originalPrice: 128, condition: '8成新', usageDuration: '使用 6 个月', tradePlace: '图书馆北门', tradeTime: '明天 12:00-14:00', status: 'available', images: ['/assets/products/books.svg'], school: '江城大学', distanceM: 80, sellerId: 'u_seller_2', views: 96, favoriteCount: 12, createdAt: agoHours(16) },
    { id: 'p_monitor', title: '戴尔 27 英寸 2K 显示器', description: '无亮点坏点，支持 Type-C 65W 反向充电，写代码和剪片都够用。只支持校内自提。', category: '数码', price: 650, originalPrice: 1699, condition: '9成新', usageDuration: '使用 1 年 5 个月', tradePlace: '男生宿舍7号楼', tradeTime: '工作日晚上', status: 'available', images: ['/assets/products/monitor.svg'], school: '江城大学', distanceM: 220, sellerId: 'u_seller_1', views: 412, favoriteCount: 58, createdAt: agoDays(1, 21, 10) },
    { id: 'p_speaker', title: 'Marshall 便携蓝牙音箱', description: '音质很好，电池续航约 8 小时。包装盒还在，支持当面连接试听。', category: '数码', price: 520, originalPrice: 1299, condition: '9成新', usageDuration: '使用 10 个月', tradePlace: '大学生活动中心', tradeTime: '周内下午', status: 'available', images: ['/assets/products/speaker.svg'], school: '江城大学', distanceM: 340, sellerId: 'u_seller_5', views: 239, favoriteCount: 31, createdAt: agoDays(1, 17, 35) },
    { id: 'p_chair', title: '人体工学靠背椅', description: '毕业搬家出，腰部支撑可调，坐垫干净。需要自己来宿舍搬走。', category: '家具', price: 120, originalPrice: 399, condition: '7成新', usageDuration: '使用 1 年', tradePlace: '女生宿舍8号楼', tradeTime: '每晚 21:00 后', status: 'available', images: ['/assets/products/chair.svg'], school: '江城大学', distanceM: 500, sellerId: 'u_seller_3', views: 185, favoriteCount: 22, createdAt: agoDays(2, 20, 15) },
    { id: 'p_racket', title: '尤尼克斯羽毛球拍 双拍', description: '入门进阶款，已重新拉线。两把一起出，送球和三支手胶。', category: '运动用品', price: 260, originalPrice: 680, condition: '8成新', usageDuration: '使用 1 年', tradePlace: '体育馆西门', tradeTime: '周三、周五 18:00', status: 'available', images: ['/assets/products/racket.svg'], school: '江城大学', distanceM: 280, sellerId: 'u_seller_2', views: 173, favoriteCount: 26, createdAt: agoDays(2, 12, 0) },
    { id: 'p_kettle', title: '米家恒温电水壶', description: '保温功能正常，已深度除垢。宿舍烧水很方便，离校前低价出。', category: '宿舍用品', price: 45, originalPrice: 169, condition: '8成新', usageDuration: '使用 1 年', tradePlace: '男生宿舍4号楼', tradeTime: '今晚 18:30 后', status: 'available', images: ['/assets/products/kettle.svg'], school: '江城大学', distanceM: 160, sellerId: 'u_demo', views: 121, favoriteCount: 16, createdAt: agoDays(3, 9, 40) },
    { id: 'p_calculator', title: '卡西欧科学计算器', description: '功能正常，按键灵敏，附赠保护套。理工科考试和平时作业都能用。', category: '教材', price: 65, originalPrice: 189, condition: '8成新', usageDuration: '使用 2 年', tradePlace: '教学楼3号楼', tradeTime: '工作日 12:30', status: 'available', images: ['/assets/products/calculator.svg'], school: '江城大学', distanceM: 90, sellerId: 'u_seller_5', views: 84, favoriteCount: 9, createdAt: agoDays(3, 16, 20) },
    { id: 'p_backpack', title: '国家地理双肩包 大容量', description: '能装下 16 寸电脑和两天换洗衣物，防泼水。拉链和肩带都完好。', category: '其他', price: 130, originalPrice: 499, condition: '8成新', usageDuration: '使用 1 年半', tradePlace: '图书馆南门', tradeTime: '周六上午', status: 'available', images: ['/assets/products/backpack.svg'], school: '江城理工大学', distanceM: 1800, sellerId: 'u_seller_4', views: 268, favoriteCount: 38, createdAt: agoDays(4, 14, 0) },
    { id: 'p_keyboard', title: 'HHKB 机械键盘 无线版', description: '已交易完成。手感很好，买家已当面验货。', category: '数码', price: 680, originalPrice: 1499, condition: '9成新', usageDuration: '使用 1 年', tradePlace: '图书馆北门', tradeTime: '已交易', status: 'completed', images: ['/assets/products/keyboard.svg'], school: '江城大学', distanceM: 80, sellerId: 'u_demo', views: 346, favoriteCount: 44, createdAt: agoDays(18, 11, 0) },
  ]

  const insertProduct = db.prepare(`
    INSERT INTO products (id, title, description, category, price, original_price, condition, usage_duration, trade_place, trade_time, status, images, school, distance_m, seller_id, views, favorite_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of products) {
    insertProduct.run(p.id, p.title, p.description, p.category, p.price, p.originalPrice, p.condition, p.usageDuration, p.tradePlace, p.tradeTime, p.status, JSON.stringify(p.images), p.school, p.distanceM, p.sellerId, p.views, p.favoriteCount, p.createdAt)
  }

  const insertFavorite = db.prepare('INSERT INTO favorites (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)')
  insertFavorite.run(randomUUID(), 'u_demo', 'p_ipad_air5', agoHours(1))
  insertFavorite.run(randomUUID(), 'u_demo', 'p_books', agoHours(3))
  insertFavorite.run(randomUUID(), 'u_seller_2', 'p_lamp', agoHours(5))

  const chatId = 'chat_demo_ipad'
  db.prepare('INSERT INTO chats (id, product_id, buyer_id, seller_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(chatId, 'p_ipad_air5', 'u_demo', 'u_seller_1', agoHours(1.4), agoHours(0.8))
  const insertMessage = db.prepare('INSERT INTO messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
  insertMessage.run('msg_1', chatId, 'u_demo', '你好，请问还可以交易吗？', agoHours(1.4))
  insertMessage.run('msg_2', chatId, 'u_seller_1', '可以的，晚上 7 点宿舍楼下见。', agoHours(1.2))
  insertMessage.run('msg_3', chatId, 'u_demo', '好，我先确认下平板电池健康。', agoHours(0.8))

  const tradeId = 'trade_demo_keyboard'
  db.prepare('INSERT INTO trades (id, product_id, buyer_id, seller_id, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(tradeId, 'p_keyboard', 'u_seller_2', 'u_demo', 'completed', agoDays(17, 16, 0), agoDays(17, 20, 30))
  db.prepare('INSERT INTO reviews (id, trade_id, reviewer_id, reviewee_id, rating, content, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), tradeId, 'u_seller_2', 'u_demo', 5, '描述很准确，沟通也很爽快。', JSON.stringify(['描述一致', '回复及时', '守时']), agoDays(17, 21, 0))

  const productIds = products.map((product) => product.id)
  const userIds = users.map((user) => user[0] as string)
  const eventNames = ['view_home', 'expose_product', 'click_product', 'click_chat', 'publish_product', 'publish_product_success', 'send_message', 'complete_trade'] as const
  const baseCounts: Record<(typeof eventNames)[number], number> = {
    view_home: 34,
    expose_product: 96,
    click_product: 39,
    click_chat: 14,
    publish_product: 9,
    publish_product_success: 8,
    send_message: 28,
    complete_trade: 3,
  }

  const insertEvent = db.prepare('INSERT INTO analytics (event_id, user_id, product_id, event_name, timestamp, session_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (let day = 6; day >= 0; day -= 1) {
    for (const eventName of eventNames) {
      const growth = 6 - day
      const count = baseCounts[eventName] + Math.floor(growth * (eventName === 'expose_product' ? 7 : 2.2))
      for (let index = 0; index < count; index += 1) {
        const userId = userIds[(index + day * 3) % userIds.length]
        const productId = eventName === 'view_home' ? null : productIds[(index * 3 + day) % productIds.length]
        const stamp = new Date()
        stamp.setDate(stamp.getDate() - day)
        stamp.setHours(8 + ((index * 7 + day) % 14), (index * 11) % 60, (index * 13) % 60, 0)
        const source = index % 3 === 0 ? 'search' : index % 3 === 1 ? 'home' : 'recommend'
        const eventProduct = products.find((product) => product.id === productId)
        const metadata = eventName === 'complete_trade'
          ? { source, amount: eventProduct?.price || 0 }
          : { source }
        insertEvent.run(
          randomUUID(),
          userId,
          productId,
          eventName,
          stamp.toISOString(),
          `seed-session-${day}-${index % 24}`,
          JSON.stringify(metadata),
        )
      }
    }
  }

  db.prepare('INSERT INTO analytics (event_id, user_id, product_id, event_name, timestamp, session_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), 'u_demo', 'p_ipad_air5', 'view_home', nowIso(), 'demo-live-session', '{}')
}

initializeDatabase()
seedDatabase()

export function resetDatabase() {
  db.exec(`
    DELETE FROM analytics;
    DELETE FROM reviews;
    DELETE FROM trades;
    DELETE FROM messages;
    DELETE FROM chats;
    DELETE FROM favorites;
    DELETE FROM products;
    DELETE FROM users;
  `)
  seedDatabase()
}


