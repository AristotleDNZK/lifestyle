# paddle_v1.0 审核提交材料

日期：2026-05-06

本批次名称：`paddle_v1.0`

## 1. 提交边界

本批次按你的要求执行：**不改变产品形态**。

这意味着以下内容按当前项目形态接入 Paddle：

- credits 购买：`Starter Pack`、`Popular Pack`、`Pro Pack`。
- workspace 订阅：`Mini Plan`、`Standard Plan`、`Plus Plan`。
- dating-profile-review 报告解锁：`Dating Profile Review Unlock`，当前价格 USD 3.99。
- AI 人像/图像/视频生成相关产品形态不做合规改名。
- credits 表述不做合规重命名。

风险说明：Paddle 可能因为 dating services、AI 人像/脸部生成、低价商品、credits 储值误解而要求补充材料、整改或拒绝。代码已经完成 Paddle 链路，但审核结果取决于 Paddle。

## 2. 已完成的代码入口

- 通用 Paddle checkout：`/api/payments/checkout`
- profile review Paddle checkout：`/api/payments/profile-review/checkout`
- Paddle webhook：`/api/payments/webhooks/paddle`
- 全局 Paddle.js：`app/_components/paddle-script.tsx`
- 数据库迁移：`supabase/migrations/20260506_paddle_v1_billing.sql`
- billing catalog：`lib/billing/catalog.ts`
- webhook fulfillment：`lib/billing/fulfillment.ts`

Webhook URL：

```text
https://yourdomain.com/api/payments/webhooks/paddle
```

## 3. Paddle Dashboard 人工操作清单

以下操作必须由你人工登录 Paddle Dashboard 完成，不能由代码自动替你提交：

1. 注册或登录 Paddle Dashboard。
2. 完成身份验证。
3. 完成 payout settings。
4. 创建产品和价格。
5. 创建 client-side token。
6. 创建 server API key。
7. 创建 Notification Destination。
8. 配置 Webhook URL。
9. 复制 webhook secret 到环境变量。
10. 提交 Domain Review。
11. 提交产品审核说明。
12. 审核通过后把生产 price id 写入部署环境变量。

## 4. Products 与 Prices

需要在 Paddle Catalog 中创建以下产品和价格：

| 内部 SKU | Paddle 产品名 | 类型 | 当前价格 |
| --- | --- | --- | --- |
| `credits_starter` | Starter Pack | one-time | USD 9.99 |
| `credits_popular` | Popular Pack | one-time | USD 39.99 |
| `credits_pro` | Pro Pack | one-time | USD 69.99 |
| `sub_mini_monthly` | Mini Plan | recurring monthly | USD 9.00/month |
| `sub_standard_monthly` | Standard Plan | recurring monthly | USD 30.00/month |
| `sub_plus_monthly` | Plus Plan | recurring monthly | USD 60.00/month |
| `profile_review_unlock` | Dating Profile Review Unlock | one-time | USD 3.99 |

创建后写入环境变量：

```env
PADDLE_PRICE_CREDITS_STARTER=
PADDLE_PRICE_CREDITS_POPULAR=
PADDLE_PRICE_CREDITS_PRO=
PADDLE_PRICE_SUB_MINI_MONTHLY=
PADDLE_PRICE_SUB_STANDARD_MONTHLY=
PADDLE_PRICE_SUB_PLUS_MONTHLY=
PADDLE_PRICE_PROFILE_REVIEW_UNLOCK=
```

## 5. Notification Destination

Paddle Dashboard 路径：

```text
Developer Tools > Notifications > New destination
```

Webhook URL：

```text
https://yourdomain.com/api/payments/webhooks/paddle
```

至少选择：

- `transaction.completed`
- `transaction.paid`
- `transaction.canceled`
- `subscription.created`
- `subscription.activated`
- `subscription.updated`
- `subscription.past_due`
- `subscription.paused`
- `subscription.resumed`
- `subscription.canceled`

当前代码只在 `transaction.completed` 做最终交付。其他事件先记录到 `billing_events`，后续可扩展退款、订阅状态降级、取消等动作。

## 6. 环境变量

Sandbox：

```env
PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production：

```env
PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
PADDLE_API_KEY=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 7. Domain Review 提交说明

Paddle Dashboard 中提交 Domain Review 时填写生产域名：

```text
https://yourdomain.com
```

必须确保以下页面可访问：

- 首页
- Pricing
- Login/Signup
- Terms
- Privacy Policy
- Refund Policy
- Contact/Support
- AI 内容政策或 Acceptable Use Policy

## 8. 产品审核说明英文稿

```text
We are submitting paddle_v1.0 for review.

Our product is an AI image and video generation SaaS with a credit-based and subscription-based billing model. Customers can purchase credit packs or monthly subscriptions. Credits are consumed inside the software for AI generation features.

The product also includes a Dating Profile Review flow. Users upload their own photos and receive an AI-generated report. The paid unlock gives access to the full report inside the user account and by email.

All paid products are delivered digitally after Paddle confirms payment through webhook. We do not collect card details directly. Paddle Checkout is used for checkout and Paddle is configured as Merchant of Record.

Webhook URL:
https://yourdomain.com/api/payments/webhooks/paddle

Support email:
support@yourdomain.com
```

## 9. 审核提交前自检

- [ ] `supabase/migrations/20260506_paddle_v1_billing.sql` 已执行。
- [ ] 所有 Paddle price id 已写入环境变量。
- [ ] `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` 已写入前端环境。
- [ ] `PADDLE_WEBHOOK_SECRET` 已写入服务端环境。
- [ ] Webhook URL 是 HTTPS。
- [ ] Dashboard 中 Notification Destination 已启用。
- [ ] Sandbox 能打开 Paddle Checkout。
- [ ] Sandbox `transaction.completed` 能写入 `billing_events`。
- [ ] credits 购买后 `users.credits` 增加。
- [ ] profile review 付款后 `profile_review_orders.provider = paddle`。
- [ ] Paddle Dashboard 中再提交 Domain Review 和产品审核。
