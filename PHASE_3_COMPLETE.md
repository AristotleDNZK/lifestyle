# Phase 3 Complete: 生成后端 (Serverless Functions) ✅

## 完成时间
2026-02-21

## 已实现功能

### 核心架构

完整的 AI 生成流程，包含：
1. ✅ 原子化积分扣除（防止并发问题）
2. ✅ 双模态支持（图像生成 Live + 视频生成 Stub）
3. ✅ Volcengine Seed 2.0 API 集成
4. ✅ Cloudflare R2 存储和 CDN
5. ✅ 错误处理和积分退款机制

---

## 文件结构

### 1. Volcengine API 封装 (`lib/volcengine.ts`)

**功能**: 封装火山引擎 Seed 2.0 图像生成 API

**关键特性**:
- ✅ HMAC-SHA256 签名认证
- ✅ Text-to-Image 生成
- ✅ 支持多种宽高比（1:1, 16:9, 9:16, 4:3, 3:4）
- ✅ 可配置参数（seed, scale, stylePreset）
- ✅ 图片下载为 Buffer（用于上传 R2）

**API 方法**:
```typescript
// 生成图像
generateImage(params: ImageGenerationParams): Promise<ImageGenerationResponse>

// 下载图像
downloadImage(url: string): Promise<Buffer>

// 检查配置
isVolcengineConfigured(): boolean
```

**使用示例**:
```typescript
const result = await generateImage({
  prompt: "A beautiful sunset over mountains",
  aspectRatio: "16:9",
  scale: 7.5
});

if (result.success) {
  const imageBuffer = await downloadImage(result.imageUrl);
}
```

---

### 2. Cloudflare R2 存储 (`lib/r2.ts`)

**功能**: 封装 Cloudflare R2 对象存储（S3 兼容）

**关键特性**:
- ✅ 使用 AWS SDK for S3（R2 兼容）
- ✅ 自动生成唯一文件名（timestamp + hash）
- ✅ 支持图片和视频上传
- ✅ 自动 MIME 类型识别
- ✅ 返回公开访问 URL

**API 方法**:
```typescript
// 通用上传
uploadToR2(buffer: Buffer, fileType: 'image' | 'video', ext?: string): Promise<string>

// 图片上传
uploadImage(buffer: Buffer, ext?: string): Promise<string>

// 视频上传
uploadVideo(buffer: Buffer, ext?: string): Promise<string>

// 检查配置
isR2Configured(): boolean
```

**文件命名**:
```
images/1708531200000-a1b2c3d4e5f6g7h8.png
videos/1708531200000-1a2b3c4d5e6f7g8h.mp4
```

---

### 3. 积分管理工具 (`lib/credits.ts`)

**功能**: 统一的积分操作接口

**API 方法**:
```typescript
// 扣除积分（原子化）
deductCredits(userId: string, amount: number): Promise<boolean>

// 增加积分（用于退款）
addCredits(userId: string, amount: number): Promise<number>

// 获取余额
getCreditBalance(userId: string): Promise<number>

// 获取用户统计
getUserStats(userId: string): Promise<UserStats>

// 确保用户存在
ensureUserExists(userId: string, email: string): Promise<void>

// 检查余额是否充足
hasSufficientCredits(userId: string, required: number): Promise<boolean>
```

**积分成本**:
```typescript
const CREDIT_COSTS = {
  image: 1,   // 图片生成：1 积分
  video: 10,  // 视频生成：10 积分（预留）
};
```

---

### 4. 生成 API 路由 (`/api/generate`)

**功能**: 统一的 AI 生成入口

**请求格式**:
```json
POST /api/generate
{
  "type": "image",           // 或 "video"
  "prompt": "A sunset...",   // 必需
  "aspectRatio": "16:9",     // 可选，仅图片
  "seed": 12345,             // 可选
  "scale": 7.5               // 可选
}
```

**处理流程**:

#### Image 流程（Active）:
```
1. 认证用户（Clerk）
2. 验证参数
3. 扣除 1 积分（RPC deduct_credits）
   ↓ 余额不足？→ 返回 402 错误
4. 调用 Volcengine API 生成图片
5. 下载临时图片（Binary Buffer）
6. 上传到 Cloudflare R2
7. 保存记录到 generations 表
8. 返回 R2 URL
   ↓ 任何步骤失败？→ 退还积分
```

#### Video 流程（Stub - Coming Soon）:
```
1. 认证用户
2. 验证参数
3. 直接返回 "coming_soon" 消息
   ↓ 不扣费，不调用 API
```

**响应格式**:

**成功（图片）**:
```json
{
  "success": true,
  "type": "image",
  "url": "https://pub-xxx.r2.dev/images/1708531200000-xxx.png",
  "prompt": "A sunset...",
  "creditsUsed": 1,
  "requestId": "req_xxx"
}
```

**成功（视频 - Coming Soon）**:
```json
{
  "status": "coming_soon",
  "message": "Seedance 2.0 is currently in closed beta...",
  "type": "video"
}
```

**失败（余额不足）**:
```json
{
  "error": "Insufficient credits",
  "required": 1,
  "message": "Please purchase more credits..."
}
// HTTP 402 Payment Required
```

**失败（生成错误）**:
```json
{
  "error": "Failed to generate image...",
  "type": "image",
  "creditsRefunded": true
}
// HTTP 500
```

---

### 5. 生成页面 (`/generate`)

**功能**: 前端生成界面

**特性**:
- ✅ 双标签页（Image / Video）
- ✅ Prompt 输入框
- ✅ 宽高比选择器（图片）
- ✅ 实时生成状态
- ✅ 错误提示
- ✅ 结果展示（图片预览 + 下载链接）
- ✅ Coming Soon 提示（视频）

**访问**: http://localhost:3000/generate

---

## 错误处理机制

### 1. 积分退款逻辑

**触发条件**:
- Volcengine API 调用失败
- 图片下载失败
- R2 上传失败
- 数据库插入失败

**实现**:
```typescript
if (creditsDeducted && userId) {
  await supabaseAdmin.rpc("add_credits", {
    p_user_id: userId,
    p_amount: CREDIT_COST[generationType]
  });
  console.log("Credits refunded successfully");
}
```

### 2. 日志记录

所有关键步骤都有日志：
```typescript
console.log(`Attempting to deduct ${costInCredits} credits...`);
console.log("Calling Volcengine API...");
console.log("Downloading image...");
console.log("Uploading to R2...");
console.log("Generation completed successfully");
```

### 3. 错误分类

| 错误类型 | HTTP 状态码 | 是否退款 |
|---------|-----------|---------|
| 未认证 | 401 | N/A |
| 参数错误 | 400 | N/A |
| 余额不足 | 402 | 否（未扣费）|
| 生成失败 | 500 | 是 |
| R2 上传失败 | 500 | 是 |

---

## 环境变量配置

### 必需变量（Phase 3）

```env
# Volcengine API
VOLC_ACCESS_KEY=your-access-key
VOLC_SECRET_KEY=your-secret-key
VOLC_REGION=cn-north-1  # 可选，默认 cn-north-1

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=https://pub-xxxxx.r2.dev
```

### 配置步骤

#### 1. 火山引擎配置

1. 访问 [火山引擎控制台](https://console.volcengine.com)
2. 创建 Access Key 和 Secret Key
3. 开通 CV (Computer Vision) 服务
4. 填写到 `.env.local`

#### 2. Cloudflare R2 配置

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 创建 R2 Bucket
3. 生成 API Token（R2 权限）
4. 配置公开访问（或自定义域名）
5. 填写到 `.env.local`

**R2 公开访问设置**:
```
Cloudflare Dashboard > R2 > Your Bucket > Settings
→ Enable Public Access
→ Copy Public URL (例如: https://pub-xxxxx.r2.dev)
```

---

## 测试指南

### 1. 环境检查

创建测试脚本验证配置：

```typescript
import { isVolcengineConfigured } from '@/lib/volcengine';
import { isR2Configured } from '@/lib/r2';

console.log('Volcengine:', isVolcengineConfigured() ? '✓' : '✗');
console.log('R2:', isR2Configured() ? '✓' : '✗');
```

### 2. 图片生成测试

**使用前端页面**:
1. 访问 http://localhost:3000/generate
2. 选择 "Image Generation" 标签
3. 输入 Prompt: `"A beautiful sunset over mountains"`
4. 选择宽高比: `16:9`
5. 点击 "Generate Image"

**使用 API**:
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "prompt": "A beautiful sunset over mountains",
    "aspectRatio": "16:9"
  }'
```

### 3. 视频请求测试

**预期结果**: 返回 "coming soon" 消息，不扣费

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "prompt": "A timelapse of clouds"
  }'
```

**响应**:
```json
{
  "status": "coming_soon",
  "message": "Seedance 2.0 is currently in closed beta..."
}
```

### 4. 余额不足测试

1. 在 Supabase 中将用户积分设为 0:
```sql
UPDATE users SET credits = 0 WHERE id = 'user_xxx';
```

2. 尝试生成图片
3. 预期返回 402 错误

### 5. 错误恢复测试

**测试退款机制**:
1. 暂时设置错误的 R2 配置
2. 尝试生成图片（会在 R2 上传步骤失败）
3. 检查日志：应显示 "Credits refunded successfully"
4. 检查数据库：积分应已退还

---

## 数据库操作

### 生成记录查询

```sql
-- 查看所有生成记录
SELECT * FROM generations ORDER BY created_at DESC;

-- 查看用户的生成历史
SELECT * FROM generations
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC;

-- 统计生成数量
SELECT
  type,
  COUNT(*) as count,
  SUM(cost) as total_cost
FROM generations
WHERE user_id = 'user_xxx' AND status = 'completed'
GROUP BY type;
```

### 积分余额查询

```sql
-- 查看用户积分
SELECT id, email, credits FROM users WHERE id = 'user_xxx';

-- 查看所有用户积分
SELECT id, email, credits FROM users ORDER BY credits DESC;
```

---

## 性能优化建议

### 1. 图片缓存

Volcengine 返回的临时 URL 可以缓存：
```typescript
// 未来优化：添加本地缓存层
const cachedUrl = await checkCache(prompt);
if (cachedUrl) return cachedUrl;
```

### 2. 并发限制

使用队列系统限制并发生成：
```typescript
// 未来优化：添加 BullMQ 或 Redis Queue
const job = await queue.add('generate-image', { prompt, userId });
```

### 3. 轮询优化（视频）

当视频功能上线后，使用轮询检查状态：
```typescript
// 未来：视频生成（异步）
const taskId = await volcengine.createVideoTask(prompt);
// 返回 taskId，前端轮询 /api/generate/status/:taskId
```

---

## 安全要点

### 1. ✅ 原子化扣费
使用 Supabase RPC `deduct_credits` 确保并发安全

### 2. ✅ 认证保护
所有 `/api/generate` 请求需要 Clerk 认证

### 3. ✅ 输入验证
验证 prompt、type、aspectRatio 等参数

### 4. ✅ 错误隔离
Volcengine/R2 错误不暴露给前端，只返回通用错误信息

### 5. ✅ 积分退款
任何失败都会自动退款，防止用户损失

---

## 已知限制和未来优化

### 当前限制

1. **同步生成**: 图片生成是同步的，可能超时（建议改为异步）
2. **无队列**: 高并发时可能超载
3. **无缓存**: 相同 prompt 会重复生成
4. **无历史**: 用户看不到生成历史（需要前端页面）

### 未来优化

1. **异步生成**: 使用任务队列 + 轮询
2. **生成历史页面**: 展示用户所有生成记录
3. **Prompt 缓存**: 避免重复生成
4. **批量生成**: 支持一次生成多张图
5. **高级参数**: 支持更多 Seed 2.0 参数
6. **视频生成**: 集成 Seedance 2.0 API

---

## 构建状态

✅ **构建成功**:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    175 B          96.2 kB
├ ○ /dashboard                           24.2 kB         120 kB
├ ○ /generate                            7.29 kB        94.6 kB
├ ƒ /api/generate                        0 B                0 B
├ ƒ /api/stripe/checkout                 0 B                0 B
└ ƒ /api/webhooks/stripe                 0 B                0 B
```

---

## 文件清单

### 新增文件

```
lib/
├── volcengine.ts         # Volcengine Seed 2.0 API 封装
├── r2.ts                 # Cloudflare R2 存储封装
└── credits.ts            # 积分管理工具

app/
├── api/
│   └── generate/
│       └── route.ts      # 生成 API 路由 ⚡ 核心
└── generate/
    └── page.tsx          # 生成页面（前端）

PHASE_3_COMPLETE.md       # 本文档
```

### 修改文件

```
app/
├── page.tsx              # 添加 "Start Generating" 按钮
└── dashboard/page.tsx    # 添加到生成页面的链接

.env.local                # 添加 Volcengine + R2 配置
package.json              # 添加 @aws-sdk/client-s3 依赖
```

---

## 下一步: Phase 4

根据 `TASK_BRIEF_GLOBAL_SAAS.md`，下一阶段是前端 UI 完善：

### Phase 4 任务
1. ✅ 生成页面（已完成）
2. 📋 生成历史页面
3. 💳 积分余额显示
4. 👤 用户个人中心
5. 📊 统计图表
6. 🎨 UI/UX 优化

---

## 总结

Phase 3 成功实现：

1. ✅ **完整的生成流程** - 从扣费到存储
2. ✅ **双模态支持** - 图片 Live + 视频 Stub
3. ✅ **金融级安全** - 原子化扣费 + 自动退款
4. ✅ **错误处理** - 完善的日志和恢复机制
5. ✅ **可扩展架构** - 易于添加新模型和功能

**下一步**: 配置 Volcengine 和 R2，开始测试生成功能！

---

📝 配置指南见 `.env.local`
📚 项目总览见 `README.md`
💳 支付集成见 `STRIPE_SETUP.md`
