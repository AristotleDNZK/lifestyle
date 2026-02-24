# API 配置完整指南

本文档详细说明如何注册所有第三方服务并获取 API 密钥。

---

## 配置清单

需要配置 **5 个第三方服务** 的 **17 个环境变量**：

- [ ] **Supabase** (数据库) - 3 个变量
- [ ] **Clerk** (用户认证) - 2 个变量
- [ ] **Stripe** (支付) - 3 个变量
- [ ] **Volcengine** (AI 生成) - 3 个变量
- [ ] **Cloudflare R2** (存储) - 5 个变量
- [ ] **应用配置** - 1 个变量

---

## 1. Supabase 配置（数据库）

### 1.1 注册账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **"Start your project"** 或 **"Sign Up"**
3. 使用 GitHub 账号登录（推荐）或邮箱注册

### 1.2 创建项目

1. 登录后点击 **"New Project"**
2. 填写项目信息：
   ```
   Name: video-generator (或任意名称)
   Database Password: 设置一个强密码（保存好）
   Region: 选择离你最近的区域
   Pricing Plan: Free (开发测试用)
   ```
3. 点击 **"Create new project"**
4. 等待 2-3 分钟，项目创建完成

### 1.3 执行数据库脚本

1. 在项目 Dashboard 左侧菜单，点击 **"SQL Editor"**
2. 点击 **"New query"**
3. 打开项目中的 `supabase_schema.sql` 文件
4. 复制**全部内容**
5. 粘贴到 SQL Editor 中
6. 点击 **"Run"** 按钮（或按 Ctrl/Cmd + Enter）
7. 等待执行完成，应该看到 **"Success. No rows returned"**

### 1.4 验证数据库

1. 点击左侧 **"Table Editor"**
2. 确认看到 3 个表：
   - `users`
   - `transactions`
   - `generations`
3. 点击 **"Database"** → **"Functions"**
4. 确认看到 3 个函数：
   - `deduct_credits`
   - `add_credits`
   - `get_user_stats`

### 1.5 获取 API 密钥

1. 点击左侧菜单 **"Settings"** (齿轮图标)
2. 点击 **"API"**
3. 找到以下信息并复制：

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
复制这个 URL

#### Project API keys

**anon / public key**（公开密钥）：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
复制这个密钥

**service_role key**（服务角色密钥，⚠️ 保密）：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
复制这个密钥

### 1.6 填写到 .env.local

打开 `.env.local` 文件，填入：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（service_role key）
```

✅ **Supabase 配置完成！**

---

## 2. Clerk 配置（用户认证）

### 2.1 注册账号

1. 访问 [https://clerk.com](https://clerk.com)
2. 点击 **"Start building for free"** 或 **"Sign up"**
3. 使用 GitHub/Google 账号登录或邮箱注册

### 2.2 创建应用

1. 登录后点击 **"Create application"**
2. 填写应用信息：
   ```
   Application name: Video Generator (或任意名称)
   ```
3. 选择登录方式（建议选择）：
   - ✅ Email
   - ✅ Google
   - ✅ GitHub
4. 点击 **"Create application"**

### 2.3 配置应用

#### 基础设置

1. 在左侧菜单点击 **"Configure"** → **"Settings"**
2. 确认基本信息正确

#### 允许的域名（重要）

1. 点击左侧 **"Configure"** → **"Domains"**
2. 默认已有 Clerk 提供的域名
3. 本地开发会自动允许 `localhost:3000`
4. **部署后**需要添加生产域名（稍后配置）

### 2.4 获取 API 密钥

1. 点击左侧菜单 **"Developers"** → **"API Keys"**
2. 找到 **"Publishable key"** 和 **"Secret key"**

#### 开发环境密钥（Development）

**Publishable key** (公开)：
```
pk_test_your_publishable_key_here
```

**Secret key** (私密，⚠️ 不要暴露)：
```
sk_test_your_secret_key_here
```

#### 生产环境密钥（Production）

如果要部署到生产环境，切换到 **"Production"** 标签：

**Publishable key**：
```
pk_live_your_publishable_key_here
```

**Secret key**：
```
sk_live_your_secret_key_here
```

### 2.5 填写到 .env.local

**开发环境** (本地测试)：
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

**生产环境** (部署到 Vercel)：
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_secret_key_here
```

✅ **Clerk 配置完成！**

---

## 3. Stripe 配置（支付）

### 3.1 注册账号

1. 访问 [https://stripe.com](https://stripe.com)
2. 点击 **"Start now"** 或 **"Sign up"**
3. 填写邮箱、密码，创建账号
4. 验证邮箱

### 3.2 激活账号

1. 登录 Stripe Dashboard
2. 首次登录会要求填写：
   - 企业类型（个人/公司）
   - 所在国家/地区
   - 业务描述
3. **注意**：项目要求使用**香港账户**
   - Country: Hong Kong
   - Industry: Software / SaaS

### 3.3 获取 API 密钥

#### 测试模式（开发用）

1. 确保右上角显示 **"Test mode"**（有个测试标签）
2. 点击右上角 **"Developers"**
3. 点击 **"API keys"**

**Publishable key** (公开)：
```
pk_test_your_publishable_key_here
```

**Secret key** (私密)：
```
sk_test_your_secret_key_here
```

#### 生产模式（上线用）

1. 完成 Stripe 账户激活（需要提供企业信息和银行账户）
2. 切换到右上角 **"Live mode"**
3. 获取 Live API keys：

**Publishable key**：
```
pk_live_your_publishable_key_here
```

**Secret key**：
```
sk_live_your_secret_key_here
```

### 3.4 配置 Webhook

Webhook 用于接收支付成功的通知。

#### 本地开发（使用 Stripe CLI）

**安装 Stripe CLI**：

**macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Windows**:
1. 访问 https://github.com/stripe/stripe-cli/releases
2. 下载最新的 `stripe_X.X.X_windows_x86_64.zip`
3. 解压到某个目录（如 `C:\stripe`）
4. 添加到 PATH 环境变量

**Linux**:
```bash
wget https://github.com/stripe/stripe-cli/releases/download/vX.X.X/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**登录 Stripe CLI**:
```bash
stripe login
```
浏览器会打开，确认授权。

**启动 Webhook 转发**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

输出会显示：
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**复制这个 `whsec_xxxxx`** 作为 `STRIPE_WEBHOOK_SECRET`

#### 生产环境（Vercel 部署后）

1. 在 Stripe Dashboard，点击 **"Developers"** → **"Webhooks"**
2. 点击 **"Add endpoint"**
3. 填写信息：
   ```
   Endpoint URL: https://your-app.vercel.app/api/webhooks/stripe
   Description: Production webhook
   ```
4. 选择要监听的事件：
   - 搜索并勾选：`checkout.session.completed`
5. 点击 **"Add endpoint"**
6. 创建后，点击这个 endpoint
7. 在 **"Signing secret"** 部分，点击 **"Reveal"**
8. 复制显示的 `whsec_xxxxx`

### 3.5 填写到 .env.local

**开发环境**:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_xxxxx（从 Stripe CLI 获取）
```

**生产环境**:
```env
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_xxxxx（从 Stripe Dashboard 获取）
```

✅ **Stripe 配置完成！**

---

## 4. Volcengine 配置（火山引擎 AI）

### 4.1 注册账号

1. 访问 [https://www.volcengine.com](https://www.volcengine.com)
2. 点击右上角 **"注册"** 或 **"免费试用"**
3. 使用手机号注册（需要中国大陆手机号）
4. 完成实名认证（个人或企业）

### 4.2 开通服务

1. 登录控制台 [https://console.volcengine.com](https://console.volcengine.com)
2. 搜索 **"视觉智能"** 或 **"CV"** (Computer Vision)
3. 找到 **"图像生成"** 或 **"Seed 2.0"** 服务
4. 点击 **"立即开通"**
5. 同意服务协议
6. 开通成功

### 4.3 创建 Access Key

1. 点击右上角头像
2. 选择 **"访问密钥管理"** 或 **"密钥管理"**
3. 点击 **"新建密钥"**
4. 确认创建

**Access Key ID** (类似用户名):
```
AKLTxxxxxxxxxxxxxxxxx
```

**Secret Access Key** (类似密码，⚠️ 只显示一次，务必保存):
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **重要**：Secret Key 只显示一次，务必立即复制保存！

### 4.4 确认区域

火山引擎有多个区域：
- **cn-north-1** (华北)
- **cn-beijing** (北京)
- **ap-singapore-1** (新加坡)

默认使用 `cn-north-1`，如需更改，在控制台查看你的服务所在区域。

### 4.5 填写到 .env.local

```env
VOLC_ACCESS_KEY=AKLTxxxxxxxxxxxxxxxxx
VOLC_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VOLC_REGION=cn-north-1
```

### 4.6 测试配置

可以在火山引擎控制台的 API Explorer 中测试：
1. 找到 CV 服务的 API 文档
2. 使用 API Explorer 测试图像生成
3. 确认返回成功

✅ **Volcengine 配置完成！**

---

## 5. Cloudflare R2 配置（对象存储）

### 5.1 注册账号

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 点击 **"Sign Up"**
3. 填写邮箱、密码
4. 验证邮箱

### 5.2 创建 R2 Bucket

1. 登录 Cloudflare Dashboard
2. 在左侧菜单找到 **"R2"** (可能在 **"Storage"** 下)
3. 如果是第一次使用，点击 **"Purchase R2"** 或 **"Get Started"**
4. 点击 **"Create bucket"**
5. 填写信息：
   ```
   Bucket name: video-generator-assets (或任意名称，全局唯一)
   Location: Automatic (自动选择)
   ```
6. 点击 **"Create bucket"**

### 5.3 配置公开访问

1. 进入刚创建的 bucket
2. 点击 **"Settings"** 标签
3. 找到 **"Public access"** 部分
4. 点击 **"Allow Access"** 或切换开关启用
5. 确认警告（确保你理解公开访问的含义）

### 5.4 获取公开域名

启用公开访问后，会显示：

**Public Bucket URL**:
```
https://pub-xxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

**复制这个 URL**，这是你的 `R2_PUBLIC_DOMAIN`

### 5.5 创建 API Token

1. 返回 R2 主页
2. 点击右上角 **"Manage R2 API Tokens"**
3. 点击 **"Create API token"**
4. 填写信息：
   ```
   Token name: video-generator-token
   Permissions:
     - ✅ Object Read & Write (对象读写)
   Bucket scope:
     - Specific bucket: video-generator-assets (你的 bucket 名称)
   ```
5. 点击 **"Create API Token"**

### 5.6 获取密钥信息

创建后会显示以下信息（⚠️ 只显示一次）：

**Access Key ID**:
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Secret Access Key**:
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Endpoint for S3 Clients** (包含 Account ID):
```
https://xxxxxxxxxxxxxxxxxxxxxx.r2.cloudflarestorage.com
```

从 endpoint 提取 **Account ID**：
- 格式：`https://<Account_ID>.r2.cloudflarestorage.com`
- 例如：`https://abc123def456.r2.cloudflarestorage.com`
- Account ID 就是：`abc123def456`

⚠️ **重要**：这些信息只显示一次，务必保存！

### 5.7 填写到 .env.local

```env
R2_ACCOUNT_ID=abc123def456（从 endpoint 提取）
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=video-generator-assets（你的 bucket 名称）
R2_PUBLIC_DOMAIN=https://pub-xxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

### 5.8 测试上传（可选）

可以使用 AWS CLI 或 S3 客户端测试：

```bash
# 安装 AWS CLI
# macOS: brew install awscli
# Windows: https://aws.amazon.com/cli/

# 配置
aws configure --profile r2
# 输入 R2_ACCESS_KEY_ID 作为 Access Key
# 输入 R2_SECRET_ACCESS_KEY 作为 Secret Key
# Region: auto
# Output: json

# 测试上传
echo "test" > test.txt
aws s3 cp test.txt s3://video-generator-assets/test.txt \
  --profile r2 \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com

# 测试访问
# 浏览器打开: https://pub-xxx.r2.dev/test.txt
```

✅ **Cloudflare R2 配置完成！**

---

## 6. 应用配置

### 6.1 本地开发

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2 生产环境

部署到 Vercel 后，Vercel 会分配一个域名：

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

或者使用自定义域名：

```env
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

---

## 完整的 .env.local 文件示例

将以下内容复制到项目根目录的 `.env.local` 文件中，然后填入你的实际值：

```env
# =====================================================
# Supabase 数据库
# =====================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =====================================================
# Clerk 用户认证
# =====================================================
# 开发环境使用 pk_test_... 和 sk_test_...
# 生产环境使用 pk_live_... 和 sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# =====================================================
# Stripe 支付
# =====================================================
# 开发环境使用 test keys
# 生产环境使用 live keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# =====================================================
# Volcengine 火山引擎
# =====================================================
VOLC_ACCESS_KEY=AKLTxxxxxxxxxxxxxxxxx
VOLC_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VOLC_REGION=cn-north-1

# =====================================================
# Cloudflare R2 对象存储
# =====================================================
R2_ACCOUNT_ID=abc123def456
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=video-generator-assets
R2_PUBLIC_DOMAIN=https://pub-xxxxxxxxxxxxxxxxxxxxxx.r2.dev

# =====================================================
# 应用配置
# =====================================================
# 本地开发
NEXT_PUBLIC_APP_URL=http://localhost:3000
# 生产环境（部署后更新）
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 配置验证

### 1. 创建测试脚本

在项目根目录创建 `scripts/test-config.ts`：

```typescript
import { supabase, supabaseAdmin } from './lib/supabase';
import { isVolcengineConfigured } from './lib/volcengine';
import { isR2Configured } from './lib/r2';

async function testConfiguration() {
  console.log('🔍 Testing configuration...\n');

  // Test Supabase
  console.log('1. Testing Supabase...');
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    console.log(error ? '❌ Supabase: Failed' : '✅ Supabase: Connected');
  } catch (e) {
    console.log('❌ Supabase: Error', e);
  }

  // Test Clerk
  console.log('\n2. Testing Clerk...');
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  console.log(clerkKey ? '✅ Clerk: Keys found' : '❌ Clerk: Keys missing');

  // Test Stripe
  console.log('\n3. Testing Stripe...');
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  console.log(stripeKey ? '✅ Stripe: Keys found' : '❌ Stripe: Keys missing');

  // Test Volcengine
  console.log('\n4. Testing Volcengine...');
  console.log(isVolcengineConfigured() ? '✅ Volcengine: Configured' : '❌ Volcengine: Not configured');

  // Test R2
  console.log('\n5. Testing R2...');
  console.log(isR2Configured() ? '✅ R2: Configured' : '❌ R2: Not configured');

  console.log('\n✨ Configuration test complete!');
}

testConfiguration();
```

### 2. 运行测试

```bash
npx tsx scripts/test-config.ts
```

### 3. 预期输出

```
🔍 Testing configuration...

1. Testing Supabase...
✅ Supabase: Connected

2. Testing Clerk...
✅ Clerk: Keys found

3. Testing Stripe...
✅ Stripe: Keys found

4. Testing Volcengine...
✅ Volcengine: Configured

5. Testing R2...
✅ R2: Configured

✨ Configuration test complete!
```

---

## 常见问题

### Q1: Supabase RPC 函数调用失败

**错误**: `function deduct_credits does not exist`

**解决**:
1. 确认已执行 `supabase_schema.sql`
2. 在 Supabase Dashboard → Database → Functions 检查函数是否存在
3. 重新执行 SQL 脚本

### Q2: Clerk 认证失败

**错误**: `Clerk: Invalid publishable key`

**解决**:
1. 检查 `.env.local` 中的 key 是否正确
2. 确认没有多余的空格或换行
3. 开发环境用 `pk_test_`，生产用 `pk_live_`

### Q3: Stripe Webhook 未收到

**解决**:
1. 本地开发确保 Stripe CLI 正在运行
2. 检查 `STRIPE_WEBHOOK_SECRET` 是否匹配
3. 生产环境检查 Vercel 域名是否正确

### Q4: Volcengine API 调用失败

**错误**: `Invalid signature`

**解决**:
1. 检查 Access Key 和 Secret Key 是否正确
2. 确认服务已开通
3. 检查区域设置（VOLC_REGION）

### Q5: R2 图片无法访问

**错误**: 图片 URL 返回 403

**解决**:
1. 确认 bucket 已启用公开访问
2. 检查 `R2_PUBLIC_DOMAIN` 是否正确
3. 测试上传的文件是否可以通过 public URL 访问

---

## 安全提示

1. **永远不要提交 `.env.local` 到 Git**
   - 已包含在 `.gitignore` 中
   - 敏感信息泄露会导致安全问题

2. **区分开发和生产环境**
   - 开发用 test/development keys
   - 生产用 live/production keys

3. **定期轮换密钥**
   - 每 3-6 个月更换一次
   - 怀疑泄露时立即更换

4. **限制权限**
   - R2 token 只给必需的权限
   - Supabase service role key 只在服务器端使用

5. **监控使用情况**
   - 定期检查各服务的使用量
   - 设置告警阈值

---

## 配置完成检查清单

使用此清单确保所有配置正确：

- [ ] Supabase
  - [ ] 项目已创建
  - [ ] SQL schema 已执行
  - [ ] 3 个表存在（users, transactions, generations）
  - [ ] 3 个 RPC 函数存在
  - [ ] 3 个环境变量已填写

- [ ] Clerk
  - [ ] 应用已创建
  - [ ] 登录方式已选择
  - [ ] 2 个环境变量已填写

- [ ] Stripe
  - [ ] 账号已注册
  - [ ] API keys 已获取
  - [ ] Webhook 已配置（本地或生产）
  - [ ] 3 个环境变量已填写

- [ ] Volcengine
  - [ ] 账号已注册并实名
  - [ ] CV 服务已开通
  - [ ] Access Key 已创建
  - [ ] 3 个环境变量已填写

- [ ] Cloudflare R2
  - [ ] Bucket 已创建
  - [ ] 公开访问已启用
  - [ ] API Token 已创建
  - [ ] 5 个环境变量已填写

- [ ] 应用配置
  - [ ] APP_URL 已设置

- [ ] 测试验证
  - [ ] `npm run build` 成功
  - [ ] `npm run dev` 可以访问
  - [ ] 配置测试脚本通过

---

## 下一步

配置完成后：

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **测试功能**
   - 访问 http://localhost:3000
   - 测试登录
   - 测试支付（使用测试卡号 `4242 4242 4242 4242`）
   - 测试生成

3. **准备部署**
   - 推送代码到 Git
   - 在 Vercel 中配置相同的环境变量（使用 live keys）

---

**配置完成！现在可以开始使用你的 AI 生成平台了！** 🚀
