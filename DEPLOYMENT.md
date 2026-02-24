# Deployment Guide - Vercel Deployment

## 部署到 Vercel 的完整指南

本文档详细说明如何将 AI Video & Image Generator 项目部署到 Vercel。

---

## 前置准备

### 1. 必需的第三方服务账号

在部署之前，请确保你已经设置好以下服务：

- ✅ **Supabase**: 数据库服务
- ✅ **Clerk**: 用户认证
- ✅ **Stripe**: 支付处理
- ✅ **Volcengine (火山引擎)**: AI 图像生成
- ✅ **Cloudflare R2**: 对象存储
- ✅ **Vercel**: 部署平台（免费）

### 2. 确认本地环境正常运行

```bash
# 测试构建
npm run build

# 测试开发环境
npm run dev
```

确保所有功能正常，无错误。

---

## 第一步：准备 Vercel 账号

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub/GitLab/Bitbucket 账号登录
3. 创建新的 Organization（或使用个人账号）

---

## 第二步：推送代码到 Git 仓库

### 初始化 Git（如果还没有）

```bash
git init
git add .
git commit -m "Initial commit - AI Video & Image Generator"
```

### 推送到 GitHub/GitLab

```bash
# 创建 GitHub repository
# 然后推送代码
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

---

## 第三步：在 Vercel 中导入项目

1. 登录 Vercel Dashboard
2. 点击 **"Add New..." → "Project"**
3. 选择你的 Git 仓库
4. 点击 **"Import"**

### 项目设置

- **Framework Preset**: Next.js
- **Root Directory**: `./` (项目根目录)
- **Build Command**: `npm run build` (默认)
- **Output Directory**: `.next` (默认)
- **Install Command**: `npm install` (默认)

---

## 第四步：配置环境变量 ⚠️ 重要

在 Vercel Dashboard 的 **Settings → Environment Variables** 中添加以下所有变量：

### Supabase 配置

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取方式**:
- Supabase Dashboard → Settings → API
- URL: Project URL
- Anon Key: `anon` / `public` key
- Service Role Key: `service_role` key (⚠️ 敏感信息，不要暴露)

---

### Clerk 认证配置

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_secret_here
```

**获取方式**:
- Clerk Dashboard → API Keys
- 使用 **Live** keys (生产环境)
- 使用 **Test** keys (开发/测试环境)

**重要**: Clerk 域名配置
- Clerk Dashboard → Domains
- 添加你的 Vercel 域名 (例如: `your-app.vercel.app`)

---

### Stripe 支付配置

```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**获取方式**:
- Stripe Dashboard → Developers → API Keys
- 使用 **Live** mode keys (生产环境)

**Webhook 配置**:
1. Stripe Dashboard → Developers → Webhooks
2. 添加 endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. 选择事件: `checkout.session.completed`
4. 复制 Signing Secret 作为 `STRIPE_WEBHOOK_SECRET`

---

### Volcengine AI 配置

```env
VOLC_ACCESS_KEY=your_volcengine_access_key
VOLC_SECRET_KEY=your_volcengine_secret_key
VOLC_REGION=cn-north-1
```

**获取方式**:
- 火山引擎控制台 → 访问密钥管理
- 创建 Access Key / Secret Key
- 开通 CV (Computer Vision) 服务

---

### Cloudflare R2 配置

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_DOMAIN=https://pub-xxxxx.r2.dev
```

**获取方式**:
1. Cloudflare Dashboard → R2
2. 创建 Bucket
3. 生成 API Token (R2 权限)
4. 配置公开访问或自定义域名

**R2 公开访问设置**:
- Bucket Settings → Public Access → Enable
- 复制 Public URL

---

### 应用配置

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**注意**:
- 首次部署后，Vercel 会分配一个域名
- 回到 Environment Variables 更新这个值

---

## 环境变量清单（复制粘贴用）

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Volcengine
VOLC_ACCESS_KEY=
VOLC_SECRET_KEY=
VOLC_REGION=cn-north-1

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_DOMAIN=

# Application
NEXT_PUBLIC_APP_URL=
```

---

## 第五步：部署

### 自动部署

配置好环境变量后，Vercel 会自动部署：

```bash
# Vercel 会自动执行：
1. git clone
2. npm install
3. npm run build
4. 部署到全球 CDN
```

### 查看部署状态

- Vercel Dashboard → Deployments
- 查看日志、错误信息
- 通常 2-5 分钟完成

---

## 第六步：验证部署

### 1. 访问应用

```
https://your-app.vercel.app
```

### 2. 测试核心功能

- ✅ 用户登录 (Clerk)
- ✅ 购买积分 (Stripe)
- ✅ 生成图片 (Volcengine + R2)
- ✅ 查看 Dashboard
- ✅ 生成历史

### 3. 检查日志

Vercel Dashboard → Functions → Logs

---

## 第七步：配置自定义域名（可选）

### 1. 在 Vercel 中添加域名

- Settings → Domains
- 输入你的域名: `your-domain.com`

### 2. 配置 DNS

在你的域名提供商添加 DNS 记录：

**A 记录**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 记录**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. 更新环境变量

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. 更新 Clerk 和 Stripe

- **Clerk**: Domains → 添加自定义域名
- **Stripe**: Webhooks → 更新 endpoint URL

---

## 常见问题排查

### 1. 构建失败

**错误**: `Module not found` 或 `Type error`

**解决**:
```bash
# 本地测试构建
npm run build

# 如果本地成功但 Vercel 失败，检查：
# - 环境变量是否正确
# - Node 版本 (Vercel 默认使用最新 LTS)
```

### 2. Webhook 未收到

**检查清单**:
- ✅ Stripe Webhook URL 是否正确
- ✅ `STRIPE_WEBHOOK_SECRET` 是否匹配
- ✅ Endpoint 是否公开可访问
- ✅ Stripe Dashboard → Webhooks → Events 查看日志

**测试 Webhook**:
```bash
# 使用 Stripe CLI
stripe listen --forward-to https://your-app.vercel.app/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### 3. 图片加载失败

**检查**:
- ✅ R2 Bucket 是否配置公开访问
- ✅ `R2_PUBLIC_DOMAIN` 是否正确
- ✅ `next.config.mjs` 是否允许 R2 域名

### 4. 认证失败

**Clerk 配置**:
- ✅ Vercel 域名已添加到 Clerk Domains
- ✅ 使用 Live keys (非 Test keys)
- ✅ 环境变量正确

### 5. 数据库连接失败

**Supabase 检查**:
- ✅ Service Role Key 是否正确
- ✅ RPC 函数是否已创建
- ✅ Row Level Security (RLS) 策略是否正确

---

## 性能优化建议

### 1. 图片优化

```typescript
// next.config.mjs 已配置
images: {
  remotePatterns: [
    { hostname: "*.r2.dev" }
  ]
}
```

### 2. 边缘函数配置

```typescript
// app/api/generate/route.ts
export const runtime = 'edge'; // 使用边缘运行时（可选）
```

### 3. 缓存策略

```typescript
// 设置 R2 对象的 Cache-Control
ContentType: 'image/png',
CacheControl: 'public, max-age=31536000, immutable'
```

---

## 监控和日志

### Vercel Analytics

免费启用：
- Vercel Dashboard → Analytics
- 查看访问量、性能指标

### 日志查看

```
Vercel Dashboard → Functions → Logs
```

过滤条件：
- By Function: `/api/generate`
- By Status: `500` (错误)
- By Time Range

### 告警配置

Vercel Dashboard → Settings → Integrations
- Slack 通知
- 错误告警

---

## 安全检查清单

在生产环境部署前，确保：

- [ ] 所有环境变量使用 Live/Production keys
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 不暴露给前端
- [ ] Stripe Webhook 签名验证已启用
- [ ] Clerk 域名已正确配置
- [ ] R2 Bucket 权限设置正确（只读公开）
- [ ] 敏感日志已移除（不要 console.log 密钥）
- [ ] CORS 策略正确配置
- [ ] Rate limiting 已启用（如需要）

---

## 回滚和版本管理

### 回滚到上一个版本

Vercel Dashboard → Deployments
- 找到稳定的部署版本
- 点击 "Promote to Production"

### Git 分支策略

```bash
main → 生产环境自动部署
develop → 预览环境
feature/* → 分支预览
```

Vercel 会为每个分支创建预览 URL

---

## 成本估算

### Vercel

**Hobby 计划** (免费):
- 100 GB 带宽/月
- Serverless Functions: 100 小时执行时间/月
- 适合个人项目和测试

**Pro 计划** ($20/月):
- 1 TB 带宽
- 1000 小时 Functions
- 更快的构建速度
- 适合生产环境

### 第三方服务

- **Supabase**: 免费套餐 500MB 存储，50,000 行数据
- **Clerk**: 免费 10,000 MAU (月活用户)
- **Stripe**: 无固定费用，交易手续费 2.9% + $0.30
- **Cloudflare R2**: $0.015/GB 存储，无出口流量费
- **Volcengine**: 按调用次数计费，参考官网

---

## 总结

部署步骤：
1. ✅ 准备 Git 仓库
2. ✅ 在 Vercel 导入项目
3. ✅ 配置所有环境变量
4. ✅ 部署并验证
5. ✅ 配置自定义域名（可选）
6. ✅ 设置监控和告警

**重要提示**:
- 使用生产环境的 API 密钥
- 定期备份数据库
- 监控错误日志
- 定期更新依赖

---

**部署成功后，你的 AI 生成平台就可以对全球用户提供服务了！** 🚀

如有问题，参考各服务的官方文档：
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Stripe Docs](https://stripe.com/docs)
