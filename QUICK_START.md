# 🚀 快速启动指南

## 立即启动（无需配置）

你可以**立即启动**前端查看界面，无需填写真实的 API 密钥。

### 第 1 步：启动开发服务器

```bash
npm run dev
```

等待几秒钟，看到：

```
✓ Ready in 3s
○ Compiling / ...
✓ Compiled / in 2.1s
- Local:        http://localhost:3000
```

### 第 2 步：打开浏览器

访问：**http://localhost:3000**

---

## 可以查看的页面

### 1. 首页 `/`
- ✅ **可以访问**
- 展示项目介绍和功能
- 有两个按钮：
  - "Start Generating"
  - "Pricing"

**截图预览**：
```
┌────────────────────────────────────────┐
│   AI Video & Image Generator           │
│   Powered by Volcengine AI             │
│                                        │
│   [Start Generating]  [Pricing]       │
│                                        │
│   🎨 Image  🎬 Video  💳 Credits      │
└────────────────────────────────────────┘
```

### 2. 生成页面 `/generate`
- ⚠️ **需要登录**（会重定向到 Clerk 登录）
- 如果配置了 Clerk，可以登录查看
- 界面展示：
  - Image/Video 标签切换
  - Prompt 输入框
  - 参数选择器
  - 生成按钮

### 3. Dashboard `/dashboard`
- ⚠️ **需要登录**
- 展示：
  - 积分余额卡片
  - 统计信息
  - 生成历史网格（空状态）

### 4. 定价页面 `/pricing`
- ⚠️ **需要登录**
- 展示三个积分套餐：
  - Starter: $9.99 / 100 credits
  - Popular: $39.99 / 500 credits
  - Pro: $69.99 / 1000 credits

---

## 功能测试矩阵

| 功能 | 无配置 | 配置 Clerk | 全部配置 |
|------|--------|-----------|----------|
| 查看首页 | ✅ | ✅ | ✅ |
| 查看定价 | ⚠️ 重定向 | ✅ | ✅ |
| 用户登录 | ❌ | ✅ | ✅ |
| 查看 Dashboard | ❌ | ⚠️ 无数据 | ✅ |
| 购买积分 | ❌ | ❌ | ✅ |
| 生成图片 | ❌ | ❌ | ✅ |

---

## 逐步启用功能

### 阶段 1：查看静态页面（0 分钟）

**现在就可以做**：
```bash
npm run dev
```

访问 http://localhost:3000 查看首页。

---

### 阶段 2：启用登录（5 分钟）

只需配置 **Clerk**：

1. 访问 [clerk.com](https://clerk.com) 注册
2. 创建应用
3. 获取两个密钥
4. 更新 `.env.local`：

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_你的密钥
CLERK_SECRET_KEY=sk_test_你的密钥
```

5. 重启开发服务器（Ctrl+C 然后 `npm run dev`）

**现在可以**：
- ✅ 登录/注册
- ✅ 访问 Dashboard（但无数据）
- ✅ 访问生成页面（但无法生成）

---

### 阶段 3：查看历史数据（15 分钟）

配置 **Supabase**：

1. 访问 [supabase.com](https://supabase.com) 注册
2. 创建项目
3. 执行 `supabase_schema.sql`
4. 获取 3 个密钥
5. 更新 `.env.local`

**现在可以**：
- ✅ Dashboard 显示真实数据
- ✅ 查看积分余额
- ✅ 查看生成历史

---

### 阶段 4：购买积分（15 分钟）

配置 **Stripe**：

1. 访问 [stripe.com](https://stripe.com) 注册
2. 获取测试密钥
3. 启动 Stripe CLI
4. 更新 `.env.local`

**现在可以**：
- ✅ 购买积分（测试模式）
- ✅ 完整的支付流程

---

### 阶段 5：生成图片（30 分钟）

配置 **Volcengine** 和 **Cloudflare R2**：

1. 注册两个服务
2. 获取密钥
3. 更新 `.env.local`

**现在可以**：
- ✅ **所有功能完整可用！**

---

## 常见问题

### Q: 启动后访问页面报错？

**错误示例**：
```
Error: Clerk: Missing publishable key
```

**解决**：
- 这是正常的，因为还没配置 Clerk
- 只有首页 `/` 可以访问
- 其他页面需要配置才能访问

### Q: 可以不配置 API 直接测试生成吗？

**不可以**。生成功能必须配置：
- Clerk（认证）
- Supabase（数据库）
- Volcengine（AI API）
- Cloudflare R2（存储）

但你可以查看所有页面的**界面设计**。

### Q: 如何关闭开发服务器？

按 **Ctrl + C**（Windows/Linux）或 **Cmd + C**（Mac）

### Q: 修改代码后需要重启吗？

**不需要**。Next.js 会自动热重载（Hot Reload）。
保存文件后刷新浏览器即可看到更改。

---

## 页面预览

### 首页 `/`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AI Video & Image Generator
   Powered by Volcengine AI

   [Start Generating]  [Pricing]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        🎨 Image Generation
    Create stunning images with AI

        🎬 Video Generation
       Coming soon: Videos

        💳 Credit System
    Pay as you go with credits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Dashboard `/dashboard`（需要登录）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard          [Credits: 250 💎]
                   Purchase more →

[Total: 42]  [Spent: 58]  [Avg: 1.4]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[+ New Generation]  [Refresh]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[All] [Images] [Videos]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────┬─────────┬─────────┐
│ [IMAGE] │ [IMAGE] │ [IMAGE] │
│ Prompt  │ Prompt  │ Prompt  │
│ 1 cr.   │ 1 cr.   │ 1 cr.   │
└─────────┴─────────┴─────────┘
```

### 生成页面 `/generate`（需要登录）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Generation Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Image Generation] [Video 🔜]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prompt:
┌────────────────────────────────┐
│ Describe your image...         │
│                                │
└────────────────────────────────┘

Aspect Ratio:
[1:1] [16:9] [9:16] [4:3] [3:4]

[Generate Image] - Cost: 1 credit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 推荐启动流程

### 🎯 最快体验（5 分钟）

**目标**：看到所有页面界面

1. `npm run dev`
2. 访问 http://localhost:3000（首页）
3. 只配置 Clerk（5 分钟）
4. 登录后查看所有页面

### 🎯 完整功能（1 小时）

**目标**：所有功能可用

1. 按顺序配置：
   - Clerk（5 分钟）
   - Supabase（15 分钟）
   - Stripe（15 分钟）
   - Volcengine（15 分钟）
   - Cloudflare R2（10 分钟）

2. 测试完整流程：
   - 登录 → 购买积分 → 生成图片 → 查看历史

---

## 开发服务器命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器（需要先 build）
npm start

# 代码检查
npm run lint
```

---

## 端口占用问题

如果 3000 端口被占用：

```bash
# 使用其他端口
npm run dev -- -p 3001
```

然后访问 http://localhost:3001

---

## 下一步

启动成功后：

1. **查看界面** - 熟悉所有页面布局
2. **配置服务** - 参考 `API_CONFIGURATION_GUIDE.md`
3. **测试功能** - 逐步启用各项功能
4. **准备部署** - 参考 `DEPLOYMENT.md`

---

**立即开始**：

```bash
npm run dev
```

然后打开浏览器访问：**http://localhost:3000**

🎉 **享受你的 AI 生成平台！**
