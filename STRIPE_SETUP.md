# Stripe 支付集成设置指南

## 已实现的功能 ✅

### 1. API 路由
- **`/api/stripe/checkout`** - 创建支付会话
- **`/api/webhooks/stripe`** - 处理 Stripe Webhook

### 2. 核心功能
- ✅ Stripe Checkout Session 创建
- ✅ 用户 ID 存储在 metadata 中
- ✅ Webhook 签名验证
- ✅ checkout.session.completed 事件处理
- ✅ 原子化积分增加（使用 `add_credits` RPC）
- ✅ 交易流水记录
- ✅ 幂等性保护（防止重复处理）
- ✅ 自动用户创建（如果用户不存在）

### 3. 积分套餐

| 套餐 | 积分数 | 价格 | 单价 |
|------|--------|------|------|
| Starter | 100 | $9.99 | $0.10/credit |
| Popular | 500 | $39.99 | $0.08/credit (20% OFF) |
| Pro | 1000 | $69.99 | $0.07/credit (30% OFF) |

## 设置步骤

### 第一步：配置 Stripe Dashboard

1. **登录 Stripe Dashboard**: https://dashboard.stripe.com

2. **获取 API 密钥** (Developers > API Keys):
   ```
   Publishable key: pk_test_...
   Secret key: sk_test_...
   ```

3. **设置 Webhook** (Developers > Webhooks > Add endpoint):

   **Webhook URL**:
   ```
   开发环境: http://localhost:3000/api/webhooks/stripe
   生产环境: https://your-domain.com/api/webhooks/stripe
   ```

   **监听事件**:
   - ✅ `checkout.session.completed`

   **获取 Webhook Secret**:
   ```
   whsec_...
   ```

### 第二步：配置环境变量

在 `.env.local` 中填入以下值：

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 第三步：测试本地 Webhook（使用 Stripe CLI）

#### 安装 Stripe CLI

**macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Windows**:
下载: https://github.com/stripe/stripe-cli/releases

**Linux**:
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
```

#### 登录并转发 Webhook

```bash
# 登录 Stripe
stripe login

# 转发 webhook 到本地服务器
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

输出示例：
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

**重要**: 复制这个 signing secret 到 `.env.local` 的 `STRIPE_WEBHOOK_SECRET`

#### 触发测试事件

```bash
# 触发测试 checkout 完成事件
stripe trigger checkout.session.completed
```

### 第四步：完整测试流程

#### 1. 启动开发服务器
```bash
npm run dev
```

#### 2. 启动 Stripe CLI 监听
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### 3. 测试支付流程

**方法 1: 使用 API 测试工具（推荐）**

使用 Postman 或 cURL 测试 checkout 接口：

```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "packageType": "starter"
  }'
```

注意：需要先配置 Clerk 认证，否则会返回 401 错误。

**方法 2: 直接触发 webhook 事件**

```bash
# 创建测试 checkout session
stripe trigger checkout.session.completed
```

#### 4. 验证结果

**检查数据库**:

在 Supabase Dashboard > Table Editor 中查看：

1. **users 表**:
   - 确认积分已增加

2. **transactions 表**:
   - 确认交易记录已创建
   - 检查 `stripe_payment_id`、`amount`、`credits_added` 字段

**检查日志**:

查看终端输出，应该看到：
```
Processing checkout.session.completed: cs_test_xxxxx
Adding 100 credits to user user_xxxxx
Credits added successfully. New balance: 100
Transaction recorded successfully: pi_xxxxx
```

## API 使用示例

### 前端调用 Checkout

```typescript
// 在 React 组件中
async function handlePurchase(packageType: 'starter' | 'popular' | 'pro') {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageType }),
    });

    const data = await response.json();

    if (data.url) {
      // 重定向到 Stripe Checkout
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Checkout error:', error);
  }
}
```

### Webhook 处理流程

```
1. Stripe 发送 webhook → /api/webhooks/stripe
2. 验证签名（安全性）
3. 检查事件类型 = checkout.session.completed
4. 提取 metadata: { userId, credits }
5. 幂等性检查（避免重复处理）
6. 调用 add_credits RPC（原子化增加积分）
7. 记录 transaction 到数据库
8. 返回 200 OK
```

## 安全注意事项 ⚠️

### 1. Webhook 签名验证
- ✅ **已实现**: 使用 `stripe.webhooks.constructEvent()` 验证签名
- ⚠️ **重要**: 永远不要跳过签名验证，否则任何人都可以伪造 webhook

### 2. 幂等性处理
- ✅ **已实现**: 检查 `stripe_payment_id` 是否已存在
- ⚠️ **为什么重要**: Stripe 可能重发 webhook，防止重复加分

### 3. Service Role Key 使用
- ✅ **已实现**: Webhook 使用 `supabaseAdmin` (service role key)
- ⚠️ **重要**: Service role key 绕过 RLS，只能在服务器端使用

### 4. 用户 ID 传递
- ✅ **已实现**: userId 通过 Stripe Session metadata 传递
- ⚠️ **为什么重要**: 确保积分加到正确的用户账户

## 故障排查

### Webhook 未收到

1. **检查 Stripe CLI 是否运行**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **检查 webhook secret**:
   - 确保 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 与 CLI 输出一致

3. **检查防火墙**:
   - 确保 localhost:3000 可访问

### 签名验证失败

**错误**: `Webhook signature verification failed`

**解决方案**:
1. 检查 `STRIPE_WEBHOOK_SECRET` 是否正确
2. 确保使用原始 body（不要解析 JSON）
3. 检查 webhook secret 是否过期（重启 Stripe CLI 会生成新 secret）

### 积分未增加

1. **检查日志**: 查看终端输出是否有错误
2. **检查 Supabase RLS**: 确保 service role key 正确
3. **检查 RPC 函数**: 在 Supabase Dashboard 执行测试

```sql
-- 测试 add_credits RPC
SELECT add_credits('test_user_id', 100);
```

### 用户不存在错误

✅ **已自动处理**: Webhook 会自动创建用户

如果仍然失败：
1. 检查 Clerk userId 格式是否正确
2. 手动在 Supabase 中创建用户：

```sql
INSERT INTO users (id, email, credits)
VALUES ('user_xxxxx', 'test@example.com', 0);
```

## 测试卡号

Stripe 提供测试卡号用于开发：

| 卡号 | 用途 |
|------|------|
| 4242 4242 4242 4242 | 成功支付 |
| 4000 0000 0000 9995 | 余额不足 |
| 4000 0000 0000 0002 | 卡被拒绝 |

**到期日期**: 任意未来日期
**CVV**: 任意 3 位数
**邮编**: 任意

## 生产环境配置

### 1. 使用生产 API 密钥

在 Stripe Dashboard 切换到 **Live mode**，获取生产密钥：
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. 配置生产 Webhook

在 Stripe Dashboard > Webhooks 中添加：
```
https://your-production-domain.com/api/webhooks/stripe
```

监听事件：
- `checkout.session.completed`

### 3. 更新 webhook secret

使用生产环境的 webhook secret：
```env
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

## 下一步

现在 Stripe 支付已配置完成，可以继续：

- **Phase 3**: Volcengine AI 图像生成
- **Phase 4**: 前端 UI 开发（购买积分页面）

---

**注意**: 在生产环境中，建议添加额外的错误处理、日志记录和监控。
