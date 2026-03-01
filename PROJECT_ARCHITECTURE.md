# 项目架构与逻辑流程分析

## 📋 项目概述

**项目名称**: AI Video & Image Generator - Global GenAI SaaS
**技术栈**: Next.js 14 + TypeScript + Tailwind CSS + Supabase + Clerk
**架构模式**: Serverless (Vercel-ready)
**核心功能**: AI 图片/视频生成 + 积分制付费系统

---

## 🏗️ 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   首页    │  │ Dashboard│  │  Generate │  │  Pricing │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      认证层 (Clerk)                         │
│           ┌──────────────────────────────┐                  │
│           │  Middleware (Auth Guard)     │                  │
│           └──────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      API 路由层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ /api/generate│  │/api/stripe  │  │ /api/user   │        │
│  │   (生成)     │  │  (支付)     │  │  (统计)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                ↓            ↓            ↓
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   业务逻辑层      │ │   数据层      │ │  外部服务层   │
│                  │ │              │ │              │
│ • 积分管理        │ │  Supabase    │ │ Volcengine   │
│ • 用户管理        │ │  PostgreSQL  │ │ (AI生成)     │
│ • 生成流程        │ │              │ │              │
│                  │ │  • users     │ │ ImgBB        │
│                  │ │  • trans...  │ │ (存储)       │
│                  │ │  • gener...  │ │              │
│                  │ │              │ │ Stripe       │
│                  │ │  RPC函数:    │ │ (支付)       │
│                  │ │  • deduct... │ │              │
│                  │ │  • add_...   │ │              │
│                  │ │  • get_...   │ │              │
└──────────────────┘ └──────────────┘ └──────────────┘
```

---

## 📂 项目文件结构

```
video_generator/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # 根布局（Clerk Provider）
│   ├── page.tsx                 # 首页（公开）
│   ├── globals.css              # 全局样式
│   │
│   ├── dashboard/               # 用户控制面板
│   │   └── page.tsx            # 积分、统计、历史记录
│   │
│   ├── generate/                # AI 生成页面
│   │   └── page.tsx            # 图片/视频生成界面
│   │
│   ├── pricing/                 # 定价页面
│   │   └── page.tsx            # 积分套餐展示
│   │
│   └── api/                     # API 路由（Serverless Functions）
│       ├── generate/
│       │   └── route.ts        # ★ 核心：AI 生成 API
│       │
│       ├── stripe/
│       │   └── checkout/
│       │       └── route.ts    # Stripe 支付会话创建
│       │
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts    # Stripe 支付回调处理
│       │
│       └── user/
│           ├── stats/
│           │   └── route.ts    # 用户统计数据
│           └── generations/
│               └── route.ts    # 生成历史记录
│
├── lib/                         # 核心业务逻辑库
│   ├── supabase.ts             # ★ Supabase 客户端（双客户端模式）
│   ├── imgbb.ts                # ★ ImgBB 图片上传（通用存储层）
│   ├── volcengine.ts           # Volcengine AI API 客户端
│   ├── stripe.ts               # Stripe 支付配置
│   ├── credits.ts              # 积分管理工具函数
│   ├── r2.ts                   # Cloudflare R2 存储（备用）
│   └── env.ts                  # 环境变量验证
│
├── middleware.ts                # ★ Clerk 认证中间件
├── supabase_schema.sql          # ★ 数据库 Schema（关键）
├── .env.local                   # 环境变量配置
├── next.config.mjs              # Next.js 配置
├── tailwind.config.js           # Tailwind CSS 配置
└── package.json                 # 依赖管理

文档文件：
├── README.md                    # 项目总览
├── QUICK_START.md              # 快速启动指南
├── API_CONFIGURATION_GUIDE.md  # API 配置详细指南
├── IMGBB_SETUP.md              # ImgBB 配置指南
├── PROJECT_ARCHITECTURE.md     # 本文档
└── DEPLOYMENT.md               # 部署指南
```

---

## 🔄 核心业务流程

### 1. 用户注册/登录流程

```
用户访问页面
    ↓
middleware.ts 检查认证状态
    ↓
┌──────────────────────┐
│ 未登录？             │
│  ↓                   │
│ Clerk 登录页面       │
│  ↓                   │
│ 注册/登录            │
│  ↓                   │
│ 返回原页面           │
└──────────────────────┘
    ↓
首次访问 API/Dashboard？
    ↓
/api/user/stats 检测用户不存在
    ↓
自动创建用户记录（Supabase）
    ↓
INSERT INTO users (id, email, credits = 10)
    ↓
✅ 用户获得 10 个免费积分
```

### 2. AI 图片生成完整流程 ⭐

这是项目的核心流程，涉及多个服务协作：

```
用户在 /generate 页面
    ↓
输入 Prompt + 选择参数（宽高比等）
    ↓
点击 "Generate Image"
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  前端 → POST /api/generate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
┌─────────────────────────────────────┐
│ Step 0: 认证检查                     │
│ ─────────────────────────────────── │
│ const { userId } = await auth()     │
│                                     │
│ if (!userId) → 401 Unauthorized     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 0.5: 自动创建用户（如果不存在）  │
│ ─────────────────────────────────── │
│ SELECT * FROM users WHERE id = ?    │
│                                     │
│ 如果不存在：                         │
│   INSERT INTO users                │
│     (id, email, credits = 10)      │
│                                     │
│ 新用户获得 10 个免费积分 🎁          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 1: 原子性扣除积分（关键！）      │
│ ─────────────────────────────────── │
│ CALL deduct_credits(userId, 1)      │
│                                     │
│ PostgreSQL RPC 函数：               │
│   • SELECT FOR UPDATE（行锁）       │
│   • 检查余额 >= 1                   │
│   • UPDATE credits = credits - 1   │
│   • RETURN TRUE/FALSE              │
│                                     │
│ 如果余额不足 → 402 Payment Required  │
│ 如果成功 → creditsDeducted = true   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 2: 调用 Volcengine AI          │
│ ─────────────────────────────────── │
│ const result = await                │
│   generateImage({                  │
│     prompt,                        │
│     aspectRatio,                   │
│     seed,                          │
│     scale                          │
│   })                               │
│                                     │
│ Volcengine 返回临时 URL              │
│ (有效期约 7 天)                      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 3: 下载图片                     │
│ ─────────────────────────────────── │
│ const buffer = await                │
│   downloadImage(volcUrl)            │
│                                     │
│ 将图片下载到内存（Buffer）            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 4: 上传到 ImgBB（永久存储）     │
│ ─────────────────────────────────── │
│ const result = await                │
│   uploadToImgBB(buffer, {          │
│     expiration: 7天,               │
│     name: 'ai-gen-timestamp'       │
│   })                               │
│                                     │
│ ImgBB 返回永久 URL：                │
│ https://i.ibb.co/xxx/image.png      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 5: 保存到数据库                 │
│ ─────────────────────────────────── │
│ INSERT INTO generations             │
│   (user_id, type, prompt,          │
│    url, cost, status)              │
│ VALUES                             │
│   (userId, 'image', prompt,        │
│    imgbbUrl, 1, 'completed')       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 6: 返回结果给前端               │
│ ─────────────────────────────────── │
│ return {                           │
│   success: true,                   │
│   url: imgbbUrl,                   │
│   creditsUsed: 1,                  │
│   expiresAt: '7天后'               │
│ }                                  │
└─────────────────────────────────────┘
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  前端显示生成的图片
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

错误处理（任何步骤失败）：
    ↓
┌─────────────────────────────────────┐
│ 如果 creditsDeducted = true：        │
│                                     │
│ CALL add_credits(userId, 1)         │
│   → 退款积分                         │
│                                     │
│ return {                           │
│   error: '错误信息',                 │
│   creditsRefunded: true            │
│ }                                  │
└─────────────────────────────────────┘
```

**关键设计点：**

1. **原子性积分扣除**：使用 PostgreSQL RPC + 行锁，防止并发问题
2. **错误恢复机制**：任何步骤失败都会自动退款
3. **临时 → 永久存储**：Volcengine 临时 URL → 下载 → ImgBB 永久 URL
4. **7天自动过期**：节省存储空间，可配置为永久

---

### 3. 积分购买流程

```
用户访问 /pricing
    ↓
选择套餐（Starter/Popular/Pro）
    ↓
点击 "Purchase" 按钮
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  POST /api/stripe/checkout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
创建 Stripe Checkout Session
    metadata: { userId, credits, packageType }
    success_url: /dashboard?success=true
    cancel_url: /dashboard?canceled=true
    ↓
返回 Stripe 支付页面 URL
    ↓
用户跳转到 Stripe 支付页面
    ↓
输入信用卡信息 → 完成支付
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stripe → POST /api/webhooks/stripe
  Event: checkout.session.completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
┌─────────────────────────────────────┐
│ Step 1: 验证 Webhook 签名            │
│ ─────────────────────────────────── │
│ stripe.webhooks.constructEvent()    │
│                                     │
│ 防止伪造请求                         │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 2: 检查幂等性                   │
│ ─────────────────────────────────── │
│ SELECT * FROM transactions          │
│   WHERE stripe_payment_id = ?       │
│                                     │
│ 如果已存在 → 跳过（防止重复处理）      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 3: 自动创建用户（如果不存在）    │
│ ─────────────────────────────────── │
│ 同生成流程的 Step 0.5               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 4: 原子性添加积分               │
│ ─────────────────────────────────── │
│ CALL add_credits(userId, credits)   │
│                                     │
│ PostgreSQL RPC：                    │
│   UPDATE credits = credits + amount │
│   RETURN new_balance                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 5: 记录交易                     │
│ ─────────────────────────────────── │
│ INSERT INTO transactions            │
│   (user_id, amount, credits_added, │
│    stripe_payment_id)              │
└─────────────────────────────────────┘
    ↓
用户跳转回 /dashboard?success=true
    ↓
Dashboard 显示新的积分余额 ✅
```

---

## 🗄️ 数据库设计

### Schema 总览

```sql
┌─────────────────────────────────────────┐
│             users 表                    │
├─────────────────────────────────────────┤
│ id (TEXT, PK) ← Clerk User ID          │
│ email (TEXT, UNIQUE)                    │
│ credits (INTEGER, DEFAULT 0)            │
│ created_at (TIMESTAMPTZ)                │
└─────────────────────────────────────────┘
              ↑
              │ (user_id FK)
              │
┌─────────────────────────────────────────┐
│         transactions 表                 │
├─────────────────────────────────────────┤
│ id (UUID, PK)                          │
│ user_id (TEXT, FK → users.id)          │
│ amount (INTEGER) - 支付金额（分）        │
│ credits_added (INTEGER)                 │
│ stripe_payment_id (TEXT, UNIQUE)        │
│ created_at (TIMESTAMPTZ)                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         generations 表                  │
├─────────────────────────────────────────┤
│ id (UUID, PK)                          │
│ user_id (TEXT, FK → users.id)          │
│ type (TEXT: 'image' | 'video')         │
│ prompt (TEXT)                          │
│ url (TEXT) - ImgBB 永久 URL            │
│ cost (INTEGER) - 消耗积分               │
│ status (TEXT: 'completed' | 'failed')  │
│ created_at (TIMESTAMPTZ)                │
└─────────────────────────────────────────┘
```

### 关键 RPC 函数（防止竞态条件）

#### 1. deduct_credits - 扣除积分

```sql
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id TEXT,
  p_amount INTEGER
) RETURNS BOOLEAN

关键特性：
• SECURITY DEFINER - 提升权限执行
• FOR UPDATE - 行级锁，防止并发修改
• 原子性检查余额并扣除
• 返回 TRUE/FALSE 表示成功/失败

使用场景：
• /api/generate - 生成前扣除积分
```

#### 2. add_credits - 添加积分

```sql
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id TEXT,
  p_amount INTEGER
) RETURNS INTEGER

关键特性：
• SECURITY DEFINER
• 原子性增加积分
• 返回新的积分余额

使用场景：
• Stripe webhook - 支付成功后添加积分
• /api/generate - 错误时退款积分
```

#### 3. get_user_stats - 获取统计

```sql
CREATE OR REPLACE FUNCTION get_user_stats(
  p_user_id TEXT
) RETURNS JSON

返回：
{
  credits: 当前积分,
  total_generations: 总生成次数,
  total_spent: 总消耗积分
}

使用场景：
• /api/user/stats - Dashboard 显示统计数据
```

---

## 🔐 安全机制

### 1. 认证层（Clerk + Middleware）

```typescript
// middleware.ts
export default clerkMiddleware(async (auth, request) => {
  // 公开路由
  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/stripe',
  ])

  // 非公开路由需要认证
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
```

**保护的路由：**
- `/dashboard`
- `/generate`
- `/pricing`
- `/api/generate`
- `/api/user/*`
- `/api/stripe/checkout`

**公开的路由：**
- `/` - 首页
- `/sign-in`, `/sign-up` - Clerk 登录页
- `/api/webhooks/stripe` - Stripe 回调（有签名验证）

### 2. 数据库层（RLS - Row Level Security）

```sql
-- 用户只能读取自己的数据
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = auth.jwt() ->> 'sub');

CREATE POLICY generations_select_own ON generations
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');
```

**双客户端模式：**

```typescript
// lib/supabase.ts

// 前端使用（受 RLS 限制）
export const supabase = createClient(url, anonKey)

// 后端使用（绕过 RLS）
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

### 3. Webhook 签名验证

```typescript
// /api/webhooks/stripe
const signature = headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
// 验证失败 → 400 错误
```

### 4. 原子性操作（防止并发问题）

**问题场景：**
```
时刻 T0: 用户余额 = 1 积分
时刻 T1: 请求 A 检查余额 = 1 ✅
时刻 T2: 请求 B 检查余额 = 1 ✅
时刻 T3: 请求 A 扣除 1 → 余额 = 0
时刻 T4: 请求 B 扣除 1 → 余额 = -1 ❌ 超支！
```

**解决方案（RPC + 行锁）：**
```sql
SELECT credits FROM users WHERE id = ? FOR UPDATE;
-- 其他事务必须等待此锁释放

IF balance >= amount THEN
  UPDATE credits = credits - amount
  RETURN TRUE
ELSE
  RETURN FALSE
END IF
```

---

## 🌐 外部服务集成

### 1. Clerk（认证）

```
功能：用户注册、登录、会话管理
集成位置：
  • app/layout.tsx - <ClerkProvider>
  • middleware.ts - clerkMiddleware()
  • API 路由 - auth() 函数

数据流：
  Clerk User ID → Supabase users.id
  用户邮箱 → Supabase users.email
```

### 2. Supabase（数据库）

```
功能：用户��据、积分、交易、生成历史
访问模式：
  • 前端：supabase（受 RLS 限制）
  • 后端：supabaseAdmin（绕过 RLS）

关键 RPC：
  • deduct_credits
  • add_credits
  • get_user_stats
```

### 3. ImgBB（图片存储）

```
功能：永久存储 AI 生成的图片
特性：
  • 免费无限存储和流量
  • 全球 CDN
  • 支持所有格式（Base64/URL/Buffer）
  • 可设置过期时间（当前：7天）

数据流：
  Volcengine 临时 URL
    ↓ 下载
  Buffer (内存)
    ↓ 上传
  ImgBB 永久 URL
    ↓ 保存
  Supabase generations.url
```

### 4. Volcengine（AI 生成）

```
功能：调用 Seed 2.0 API 生成图片
认证：HMAC-SHA256 签名
配置：
  • VOLC_ACCESS_KEY
  • VOLC_SECRET_KEY
  • VOLC_REGION

返回：临时 URL（有效期约 7 天）

状态：⚠️ 当前未配置
```

### 5. Stripe（支付）

```
功能：信用卡支付、积分购买
流程：
  1. 创建 Checkout Session
  2. 用户支付
  3. Webhook 回调
  4. 添加积分

积分套餐：
  • Starter: $9.99 → 100 credits
  • Popular: $39.99 → 500 credits (20% OFF)
  • Pro: $69.99 → 1000 credits (30% OFF)

状态：⚠️ 当前未配置
```

---

## 🔄 状态管理

### 前端状态（React State）

```typescript
// Dashboard 页面
const [stats, setStats] = useState<UserStats>()
const [generations, setGenerations] = useState<Generation[]>()
const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>()

// Generate 页面
const [prompt, setPrompt] = useState('')
const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
const [loading, setLoading] = useState(false)
const [result, setResult] = useState<GenerationResult>()
```

### 后端状态（Supabase）

```
用户会话：Clerk Session Cookie
用户数据：Supabase users 表
积分余额：users.credits 字段
生成历史：generations 表
```

---

## 📊 性能优化

### 1. 数据库索引

```sql
-- 用户邮箱快速查找
CREATE INDEX idx_users_email ON users(email);

-- 用户交易快速查找
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- 幂等性检查快速查找
CREATE INDEX idx_transactions_stripe_payment_id
  ON transactions(stripe_payment_id);

-- 用户生成历史快速查找（复合索引）
CREATE INDEX idx_generations_user_created
  ON generations(user_id, created_at DESC);
```

### 2. 图片存储优化

```
选择 ImgBB 的原因：
  • 零出站流量费用（vs Cloudflare R2/AWS S3）
  • 全球 CDN 加速
  • 7天自动过期（节省存储）
  • 适配所有 AI 模型输出格式
```

### 3. Serverless 优化

```
无状态设计：
  • 所有 API 路由独立执行
  • 不依赖服务器内存状态
  • 数据库连接按需创建

冷启动优化：
  • 使用 Next.js 14 App Router
  • 边缘计算友好
  • 快速启动时间
```

---

## 🚨 错误处理

### 1. API 路由错误处理模式

```typescript
try {
  // 业务逻辑
} catch (error) {
  console.error('Error:', error)

  // 退款积分（如果已扣除）
  if (creditsDeducted) {
    await refundCredits(userId, amount)
  }

  return NextResponse.json(
    { error: error.message, creditsRefunded: true },
    { status: 500 }
  )
}
```

### 2. 前端错误显示

```typescript
// 生成失败
if (error) {
  return (
    <div className="error-card">
      <p>❌ Generation Failed</p>
      <p>{error.message}</p>
      {error.creditsRefunded && (
        <p>✅ Credits have been refunded</p>
      )}
    </div>
  )
}
```

---

## 📈 扩展性设计

### 1. 多模型支持

```typescript
// lib/imgbb.ts 设计为通用上传层
uploadToImgBB(imageData: string | Buffer)
  ↑
  支持所有 AI 模型输出：
  • Volcengine → URL
  • Banana Pro → Base64
  • DALL-E → URL
  • Stability AI → Base64
  • Midjourney → Discord URL
```

### 2. 视频生成预留

```typescript
// API 已支持 type: 'image' | 'video'
// 当前返回 "coming soon"

if (type === 'video') {
  return { status: 'coming_soon', message: '...' }
}

// 未来只需实现：
// - Volcengine Seedance 2.0 API
// - 视频文件上传到 ImgBB/R2
// - 更新积分成本（10 credits）
```

### 3. 存储层抽象

```
当前：ImgBB
未来可切换：Cloudflare R2, AWS S3, Supabase Storage

只需修改 lib/storage.ts（或创建统一接口）
API 路由代码无需改动
```

---

## 🎯 核心设计模式

### 1. 双客户端模式（Supabase）

```
前端（supabase）：
  • 受 RLS 限制
  • 只能访问自己的数据
  • 用于前端查询

后端（supabaseAdmin）：
  • 绕过 RLS
  • 可执行特权操作
  • 用于 API 路由
```

### 2. RPC 函数模式（原子操作）

```
直接 SQL：
  SELECT credits → 检查 → UPDATE credits
  ❌ 存在竞态条件

RPC 函数：
  CALL deduct_credits(user_id, amount)
  ✅ 原子性执行，自带行锁
```

### 3. Webhook 幂等性模式

```
问题：Stripe 可能重复发送 webhook
解决：
  1. 检查 stripe_payment_id 是否已存在
  2. 如果存在 → 返回 200（防止 Stripe 重试）
  3. 如果不存在 → 处理并记录
```

---

## 📝 环境变量总览

```env
# 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 数据库
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 图片存储
IMGBB_API_KEY=6f48de8c...

# AI 生成（未配置）
VOLC_ACCESS_KEY=
VOLC_SECRET_KEY=
VOLC_REGION=cn-north-1

# 支付（未配置）
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# 备用存储（未使用）
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_DOMAIN=

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

---

## 🔧 开发工具链

```
包管理器：npm
框架：Next.js 14.2.35
语言：TypeScript
样式：Tailwind CSS v3
代码检查：ESLint
构建：Next.js build
运行时：Node.js 18+
部署目标：Vercel
```

---

## 📚 相关文档

- `README.md` - 项目总览和快速开始
- `QUICK_START.md` - 详细启动指南
- `API_CONFIGURATION_GUIDE.md` - 所有 API 配置步骤
- `IMGBB_SETUP.md` - ImgBB 配置详解
- `DEPLOYMENT.md` - Vercel 部署指南
- `supabase_schema.sql` - 数据库 Schema

---

## 🎯 总结

### 已完成的核心功能

✅ **用户系统**
- Clerk 认证集成
- 自动用户创建
- 10 免费积分

✅ **数据层**
- Supabase PostgreSQL
- 3 张核心表
- 3 个 RPC 函数

✅ **存储层**
- ImgBB 图片托管
- 支持所有 AI 模型
- 7 天自动过期

✅ **安全机制**
- Clerk 中间件
- RLS 策略
- 原子性积分操作
- Webhook 签名验证

✅ **前端界面**
- Dashboard（统计、历史）
- Generate（生成界面）
- Pricing（定价页面）

### 待配置的功能

⚠️ **Volcengine AI**
- 图片生成 API
- 需要 2 个密钥

⚠️ **Stripe 支付**
- 积分购买
- 需要 3 个密钥

### 技术亮点

🌟 **原子性操作** - PostgreSQL RPC + 行锁防止竞态
🌟 **自动用户创建** - 首次访问自动初始化
🌟 **错误恢复** - 失败自动退款积分
🌟 **通用存储层** - 支持所有 AI 模型输出
🌟 **Serverless 架构** - 无状态、可扩展

---

**生成时间**: 2024 年
**项目状态**: 基础架构完成，等待 AI API 配置
**下一步**: 配置 Volcengine 或 Stripe
