# Project Brief: Global GenAI SaaS (Image & Video)

## 1. 项目概述 (Project Overview)

构建一个面向**海外用户**的 AI 视频/图像生成 SaaS 平台。 **核心架构:** **Serverless (无服务器架构)**。不使用 ECS，完全基于 Vercel 托管 + Supabase 云数据库。 **功能模块:**
1. **图像生成 (Live):** 接入火山引擎 Seed 2.0 (Doubao-Image)。
2. **视频生成 (Stub):** 预留 PixelDance (Seedance 2.0) 接口，前端显示 "Coming Soon"（暂不扣费）。 **数据存储:** **Supabase** (PostgreSQL) 用于存储用户积分、订单流水、生成历史。 **商业模式:** **Stripe 积分制** (Credit System)。用户充值积分，生成时扣除。

## 2. 技术栈 (Modern Tech Stack)

- **Hosting:** **Vercel** (前端页面 + 后端 API Functions)。

- **Database:** **Supabase** (PostgreSQL 数据库)。

- **Auth:** **Clerk** (身份认证)。

- **Payment:** **Stripe** (Checkout 模式 - 配合香港账户)。

- **Storage:** **Cloudflare R2** (对象存储，用于持久化保存生成结果，实现全球 CDN 加速)。

- **AI:** **Volcengine API** (火山引擎)。

  - *Image:* Real implementation via `cv_process`.

  - *Video:* Interface definition only (Mock/Stub implementation).

## 3. 核心架构流程 (Architecture Flow)

1. **Auth/Pay (登录与支付):** - 用户通过 Clerk 登录。
   - 用户点击充值 -> 跳转 Stripe Checkout -> 支付成功。
   - Stripe 触发 Webhook -> 后端接收通知 -> 在 Supabase 中安全地增加对应积分，并记录交易流水。

2. **Select Mode (模式选择):** - 用户在前端选择 "Image Gen" 或 "Video Gen" 标签页。

3. **Image Flow (Active - 图像生成):**
   - **验资扣费 (安全关键):** 提交 Prompt -> 后端优先调用 Supabase RPC 原子化扣除 1 积分（如余额不足直接返回 402 错误拦截）。
   - **生成调用:** 扣费成功后，后端调用 Volcengine Seed 2.0 API。
   - **桥接转存:** 后端获取生成结果 -> 下载图片二进制流 -> 上传至 Cloudflare R2。
   - **数据入库:** 将 R2 的永久 URL 存入 Supabase 的 `generations` 历史记录表。
   - **返回展示:** 返回 R2 URL 给前端渲染。*(注：若调用或上传环节失败，后端需执行补偿逻辑，退还用户 1 积分)。*

4. **Video Flow (Reserved - 视频生成):**
   - 提交 Prompt -> 后端接口直接拦截，响应 `{ status: "coming_soon" }` 或 Mock 数据。
   - 前端弹出 "Seedance 2.0 is in closed beta" 提示。
   - 预留好轮询和转存的代码结构，**暂不实际执行扣费，也不调用外部 API**。

------

## 4. 数据库设计 (Supabase Schema)

我们需要在 Supabase 中创建以下三张核心表：

1. **`users` (用户表)**
   - `id` (text, primary key): 对应 Clerk 的 User ID。
   - `email` (text): 用户邮箱。
   - `credits` (int): **核心资产**，当前剩余积分。
   - `created_at` (timestamp).
2. **`transactions` (交易流水表)**
   - `id` (uuid): 主键。
   - `user_id` (text): 关联用户。
   - `amount` (int): 充值金额 (单位: 分/cent)。
   - `credits_added` (int): 获得的积分数量。
   - `stripe_payment_id` (text): Stripe Payment Intent ID (用于对账)。
3. **`generations` (生成记录表)**
   - `id` (uuid): 主键。
   - `user_id` (text): 关联用户。
   - `type` (text): `'image'` 或 `'video'`。
   - `prompt` (text): 提示词。
   - `url` (text): **Cloudflare R2 的公开访问链接**。
   - `cost` (int): 本次消耗积分。
   - `status` (text): `'completed'`, `'failed'`。

## 4. 核心业务流程

### 4.1 原子化扣费 (Atomic Deduction - 关键安全机制)

由于 Vercel 是无状态的 Serverless 环境，高并发请求可能导致积分扣成负数。

- **解决方案:** 不要在 Next.js 代码里写 `balance = balance - cost`。
- **实施:** 必须在 Supabase 中编写一个 **RPC (Stored Procedure)** 函数，例如命名为 `deduct_credits`。
- **逻辑:** 在数据库层级锁定行 -> 检查余额 >= 消耗 -> 扣除 -> 返回成功/失败。

### 4.2 双模态生成与转存 (Generation & Storage)

1. **Check:** 后端调用 Supabase RPC `deduct_credits`。如果返回 False (余额不足)，直接返回 HTTP 402 错误。
2. **Call:** 调用火山引擎 API 生成。
3. **Bridge:** 后端下载火山引擎返回的临时图片流 -> **上传到 Cloudflare R2**。
4. **Save:** 将 R2 的永久 URL 存入 `generations` 表。
5. **Return:** 返回 R2 URL 给前端展示。
   - *注：对于 Video 模式，直接返回 `{ status: "coming_soon" }`，跳过扣费和调用步骤。*

## 5. 实施阶段 (Implementation Phases)

### Phase 1: 初始化与身份验证 (Setup & Auth)

- Initialize Next.js 14 project.
- Setup **Clerk** Authentication.
- **Database Schema Update:**
  - `generations` table needs a `type` column (`'image' | 'video'`).
  - `users` table tracks `credits`.

### Phase 2: 数据库与 Stripe 支付 (DB & Stripe HK)

- **Stripe Integration:**
  - Product: "Credit Pack" ($19.99 for 1000 credits).
  - Webhook: Updates `users.credits` upon successful payment.
  - **Metadata:** Ensure `userId` is passed in Stripe Session to link payment to user.

### Phase 3: 双模态生成链路 (Dual Generation Logic)

这是核心变更部分。

- **Service Layer:**
  - `lib/volcengine_image.ts`: 封装 Seed 2.0 图片生成 API (Text2Img)。
  - `lib/volcengine_video.ts`: **创建空壳服务 (Stub Service)**。定义好 `generateVideo()` 和 `checkStatus()` 方法，但内部直接返回 Mock 数据或抛出 "Feature not available yet" 提示。
  - `lib/r2.ts`: 通用文件上传 (支持 Content-Type 自动识别图片/视频)。
- **API Routes:**
  - `POST /api/generate/image`:
    - Cost: **1 Credit**.
    - Action: Call Seed 2.0 -> Upload R2 -> Save DB.
  - `POST /api/generate/video`:
    - Cost: **0 Credits (for now)**.
    - Action: Return JSON `{ status: "reserved", message: "Seedance 2.0 is coming soon!" }`.
    - *Note:* Keep the code structure ready so we can uncomment the real API call later.

### Phase 4: 前端界面 (UI/UX)

- **Dashboard Layout:**
  - Add **Tabs** component: `[Image Generation] | [Video Generation]`.
- **Image Tab:**
  - Input: Text Prompt + Aspect Ratio selector.
  - Gallery: Grid of images.
- **Video Tab:**
  - UI: Similar input form.
  - **State:** When "Generate" is clicked, show a Toast notification: *"Seedance 2.0 model is currently in closed beta. This feature will unlock soon."*

------

## 5. 关键配置信息 (Configuration)

### 环境变量 (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (用于 Webhook 加分和 RPC 调用，权限最高，不可暴露给前端)

# Clerk & Stripe
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Volcengine & Cloudflare R2
VOLC_ACCESS_KEY=...
VOLC_SECRET_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_DOMAIN=...
```

