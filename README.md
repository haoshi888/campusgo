# CampusGo

CampusGo 是面向大学生校园内的二手交易 Web MVP。产品核心不是做一个“更大的二手平台”，而是用**校园身份认证 + 校园地理匹配 + 当面交易**解决同校交易中的信任、距离和信息碎片化问题。

> 附近的学生，交易附近的闲置。

## 直接运行

环境要求：Node.js 22+（项目使用 Node 内置 `node:sqlite`，无需单独安装数据库）。

```bash
cd D:\codex\campusgo
npm install
npm run dev
```

打开 `http://localhost:5173`。API 默认运行在 `http://localhost:3001`。

演示账号：`13800000000` / `campusgo`。首次访问也会自动进入演示用户。

重置演示数据：`npm run db:reset`

构建生产版本：`npm run build && npm start`

## 核心体验路径

1. 进入首页，看到按“同校 → 距离 → 发布时间”综合排序的附近商品。
2. 通过分类、距离、价格、发布时间筛选商品。
3. 打开商品详情，查看卖家认证、信用、交易地点和时间。
4. 点击“立即咨询”，进入带有默认对话的模拟聊天。
5. 在聊天或详情中确认当面验货，完成交易。
6. 交易成功页展示 🎉 反馈，并完成五星评价。
7. 在用户中心查看发布中、已出售、交易记录、收藏和信用分。
8. 数据看板查看 DAU、发布量、浏览量、聊天次数、成交量和完整漏斗。

## 技术结构

```text
campusgo/
├─ server/
│  ├─ db.ts                 # SQLite 表结构、模拟数据、交易/评价数据
│  ├─ security.ts           # scrypt 密码散列
│  ├─ index.ts              # Node + Express API、埋点、分析聚合
│  └─ reset.ts              # 数据重置脚本
├─ src/
│  ├─ components/           # shadcn/ui 风格基础组件与业务组件
│  ├─ context/              # 认证、全局 Toast 反馈
│  ├─ hooks/                # 商品曝光 IntersectionObserver
│  ├─ lib/                  # API、埋点、格式化工具
│  ├─ pages/                # 首页、搜索、详情、发布、聊天、用户中心、看板
│  └─ types/                # 前端领域模型
├─ public/assets/           # 本地化头像与商品插画，不依赖外网
└─ data/campusgo.db         # 首次启动自动生成
```

## 数据模型

数据库共 8 张核心表：`users`、`products`、`favorites`、`chats`、`messages`、`trades`、`reviews`、`analytics`。

`analytics` 包含 `event_id`、`user_id`、`product_id`、`event_name`、`timestamp`、`session_id`、`metadata`。

## 埋点事件

| 事件 | 触发时机 |
| --- | --- |
| `view_home` | 进入首页 |
| `expose_product` | 商品卡片进入可视区域 45% |
| `click_product` | 点击商品卡片或进入详情 |
| `click_publish` | 进入发布页 |
| `publish_product` | 服务端创建商品 |
| `publish_product_success` | 发布成功反馈 |
| `click_chat` | 发起或进入咨询 |
| `send_message` | 发送聊天消息 |
| `favorite_product` | 收藏商品 |
| `complete_trade` | 完成交易 |

分析口径见 [docs/PRODUCT.md](docs/PRODUCT.md)，工程说明见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## Demo 边界

- 登录和校园认证为模拟实现，没有接入短信、学信网或 OCR。
- 聊天为真实本地持久化 + 自动模拟卖家回复，不接第三方 IM。
- 支付、物流、退款不在 MVP 范围，核心验证校园面交闭环。
- AI 估价为可解释的规则模型，用于验证交互，而非真实市场模型。

## 当前机器的无 npm 启动方式

如果 PowerShell 找不到 `npm`，可直接使用已安装的 pnpm：

```powershell
node C:\Users\wanglinlin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs install
node C:\Users\wanglinlin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs dev
```

生产运行：

```powershell
node C:\Users\wanglinlin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs run build
node node_modules\tsx\dist\cli.mjs server\index.ts
```
