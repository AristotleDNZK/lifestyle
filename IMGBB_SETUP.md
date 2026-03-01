# ImgBB 配置指南

## 为什么选择 ImgBB？

ImgBB 是完美的通用免费图片存储方案：

### ✅ 核心优势

- **完全免费** - 无限存储空间和带宽
- **支持所有格式** - Base64、URL、Buffer、文件
- **全球 CDN** - 快速访问
- **灵活过期** - 可设置 60秒-永久
- **简单 API** - 几行代码完成上传
- **无需信用卡** - 只需邮箱注册

### 📊 免费额度

| 特性 | 免费额度 |
|------|---------|
| 存储空间 | **无限** |
| 带宽流量 | **无限** |
| 单文件大小 | 32 MB |
| 上传次数 | 5000 次/小时 |
| API 请求 | 无限制 |

---

## 🚀 快速配置（2分钟）

### 第 1 步：获取 API Key

1. **访问 ImgBB API 页面**
   👉 https://api.imgbb.com/

2. **注册账号**
   - 点击 **"Get API Key"**
   - 选择注册方式：
     - 邮箱注册（推荐）
     - Google 账号登录
     - Facebook 账号登录

3. **获取 API Key**
   - 注册/登录后自动跳转到 API Key 页面
   - 复制你的 API Key（格式：`1234567890abcdef1234567890abcdef`）
   - ⚠️ 保存好这个 Key，每个账号只有一个

### 第 2 步：添加到项目

打开项目中的 `.env.local` 文件，添加：

```env
IMGBB_API_KEY=你的API密钥
```

**完整示例：**
```env
# ImgBB (Free Image Hosting)
IMGBB_API_KEY=1234567890abcdef1234567890abcdef
```

### 第 3 步：重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

---

## ✅ 验证配置

配置完成后，访问生成页面测试：

1. 访问 http://localhost:3002/generate
2. 输入 Prompt 生成图片
3. 检查图片 URL 是否包含 `ibb.co`
4. 图片应该可以正常显示

---

## 🎯 支持的 AI 模型

ImgBB 支持所有 AI 图片生成模型的输出格式：

| 模型 | 输出格式 | 兼容性 |
|------|---------|-------|
| **Volcengine** | 临时 URL | ✅ 自动下载后上传 |
| **Banana Pro** | Base64 | ✅ 直接上传 |
| **Stability AI** | Base64 | ✅ 直接上传 |
| **DALL-E** | 临时 URL | ✅ 自动下载后上传 |
| **Midjourney** | Discord URL | ✅ 自动下载后上传 |
| **Replicate** | 临时 URL | ✅ 自动下载后上传 |
| **Hugging Face** | Base64/Buffer | ✅ 直接上传 |

---

## ⚙️ 高级配置

### 自定义过期时间

在 `lib/imgbb.ts` 中已预设多种过期时间：

```typescript
import { uploadToImgBB, EXPIRATION } from '@/lib/imgbb';

// 永久保存
await uploadToImgBB(imageData, { expiration: EXPIRATION.PERMANENT });

// 1 小时后过期
await uploadToImgBB(imageData, { expiration: EXPIRATION.ONE_HOUR });

// 7 天后过期（当前默认）
await uploadToImgBB(imageData, { expiration: EXPIRATION.SEVEN_DAYS });

// 30 天后过期
await uploadToImgBB(imageData, { expiration: EXPIRATION.THIRTY_DAYS });

// 自定义秒数
await uploadToImgBB(imageData, { expiration: 3600 }); // 1小时
```

### 自定义图片名称

```typescript
await uploadToImgBB(imageData, {
  name: 'my-custom-name',
  expiration: EXPIRATION.SEVEN_DAYS
});
```

---

## 📝 使用示例

### 示例 1：上传 Volcengine 生成的图片

```typescript
// Volcengine 返回临时 URL
const volcResult = await generateImage(prompt);
// volcResult.imageUrl: https://volcengine.com/temp/abc123.png

// 自动下载并上传到 ImgBB
const result = await uploadToImgBB(volcResult.imageUrl, {
  expiration: EXPIRATION.SEVEN_DAYS
});

console.log(result.url); // https://i.ibb.co/xxx/image.png
console.log(result.expiresAt); // 7天后的时间
```

### 示例 2：上传 Base64 图片

```typescript
// Banana Pro 返回 Base64
const bananaResult = await banana.generate(prompt);
// bananaResult.output: "data:image/png;base64,iVBORw0KG..."

// 直接上传
const result = await uploadToImgBB(bananaResult.output, {
  expiration: EXPIRATION.PERMANENT // 永久保存
});

console.log(result.url); // https://i.ibb.co/xxx/image.png
```

### 示例 3：上传 Buffer

```typescript
// 从本地文件读取
const buffer = await fs.readFile('image.png');

// 上传
const result = await uploadToImgBB(buffer, {
  name: 'my-image',
  expiration: EXPIRATION.THREE_DAYS
});

console.log(result.url); // https://i.ibb.co/xxx/my-image.png
```

---

## 🔧 故障排除

### 错误：IMGBB_API_KEY is not configured

**原因**：未设置环境变量

**解决**：
1. 确认 `.env.local` 文件中有 `IMGBB_API_KEY=你的密钥`
2. 重启开发服务器

### 错误：Upload failed - Invalid API key

**原因**：API Key 不正确

**解决**：
1. 重新访问 https://api.imgbb.com/ 检查 API Key
2. 确保复制完整（32个字符）
3. 检查没有多余的空格

### 错误：Image too large

**原因**：图片超过 32MB

**解决**：
- 免费版单文件限制 32MB
- AI 生成的图片通常 < 10MB，不应遇到此问题
- 如果确实很大，可以考虑压缩

### 错误：Too many uploads

**原因**：超过 5000 次/小时限制

**解决**：
- 等待 1 小时后继续
- 正常使用不会遇到此限制

---

## 💰 成本对比

| 方案 | 存储成本 | 流量成本 | 总成本（1000张图片/月） |
|------|---------|---------|----------------------|
| **ImgBB** | $0 | $0 | **$0** |
| Cloudflare R2 | $0.015/GB | $0 | ~$0.01/月 |
| Supabase Storage | $0.021/GB | $0.09/GB | ~$0.11/月 |
| AWS S3 | $0.023/GB | $0.09/GB | ~$0.12/月 |

---

## 📋 常见问题

### Q: ImgBB 会删除图片吗？

A:
- 永久保存的图片不会删除
- 设置过期时间的图片到期后自动删除
- 极少数情况下，违规内容可能被删除

### Q: 可以商业使用吗？

A: 可以，但建议：
- 小规模测试：免费版完全够用
- 商业生产：考虑升级或使用 Cloudflare R2

### Q: 图片访问速度如何？

A: 全球 CDN 加速，访问速度快

### Q: 如何切换到其他存储服务？

A: 只需修改 `lib/storage.ts`，业务代码无需改动

---

## 🚀 下一步

配置完成后：

1. ✅ 测试图片生成功能
2. ✅ 检查图片可以正常显示
3. ✅ 查看 Dashboard 中的历史记录
4. 如果需要，继续配置其他服务（Stripe, Volcengine）

---

## 📞 支持

遇到问题？

- 查看 ImgBB 官方文档：https://api.imgbb.com/
- 检查 `lib/imgbb.ts` 中的日志
- 查看浏览器控制台错误信息

---

**配置完成！享受免费无限的图片存储！** 🎉
