# CampusGo 架构说明

## 1. 运行结构

- 前端：React + TypeScript + Vite + Tailwind CSS + Radix/shadcn 风格组件。
- 后端：Node.js + Express。
- 数据：Node 内置 `node:sqlite`，数据库位于 `data/campusgo.db`。
- 本地资源：商品插画与头像均为 SVG，不依赖外网图片服务。
- 开发模式：Vite 在 5173 运行，`/api` 代理到 3001。
- 生产模式：`npm run build` 生成 `dist`，`npm start` 由 Express 同时提供 API 和静态站点。

## 2. 前端分层

```text
pages      页面编排、数据请求、业务交互
components 通用 UI、布局、商品卡片
context    登录用户、全局 Toast
hooks      商品曝光等复用行为
lib        API 客户端、埋点、格式化
types      用户、商品、会话、交易、分析类型
```

所有网络请求统一经过 `src/lib/api.ts`，自动注入 `x-user-id` 并处理错误。埋点通过 `src/lib/analytics.ts` 发送，不阻塞主体验。

## 3. 后端 API

认证：`/api/auth/demo`、`/api/auth/login`、`/api/auth/register`、`/api/auth/certify`、`/api/me`。

商品：`GET/POST /api/products`、`GET /api/products/:id`、`PATCH /api/products/:id/status`、`GET /api/me/products`。

收藏：`GET /api/favorites`、`POST /api/favorites/:productId`。

聊天：`GET/POST /api/chats`、`GET /api/chats/:id`、`POST /api/chats/:id/messages`、`POST /api/chats/:id/simulate-reply`。

交易与评价：`POST /api/trades/complete`、`GET /api/trades`、`GET /api/trades/:id`、`POST /api/trades/:id/review`。

分析与估价：`POST /api/analytics/events`、`GET /api/analytics/dashboard`、`POST /api/valuation`。

## 4. 数据一致性

成交使用事务处理：写入 `trades`、更新商品状态为 `completed`、卖家交易次数加 1、写入 `complete_trade` 埋点。

收藏切换使用事务同步 `favorites` 与 `favorite_count`，避免计数漂移。

## 5. 安全边界

Demo 已实现密码 scrypt 散列、基本输入校验、用户会话隔离。真实上线还需要短信验证码与限流、JWT/session、对象存储与内容审核、CSRF 防护和真实支付托管。
