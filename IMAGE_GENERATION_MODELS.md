# 项目生图模型与调用方式（代码审计版）

本文档基于当前仓库代码的静态分析，梳理“生图（图片生成/重绘）”实际调用的**上游模型**、**前端页面的 model 选项**、**扣费（credits）**与**调用链路**。

> 术语说明  
> - **T2I**：Text-to-Image（文生图）  
> - **I2I**：Image-to-Image（图生图/重绘）  
> - **Credits**：平台内部记账单位（由 Stripe 购买包换算），不是上游厂商账单金额

---

## 1. 结论概览：当前代码里实际用了哪些“生图模型”

当前项目后端 `POST /api/generate` 实际存在两条图片生成链路（通过请求体分流）：

1) **Volcengine Seed 2.0（文生图）**  
   - 上游：火山引擎视觉智能（`cv` 服务）  
   - 调用：`CVProcess` + `req_key=text2image_v2`，`model_version=general_v2.0`  
   - 前端：`/generate`（无 model 下拉选项，模型固定）  
   - 成本：**1 credit/张**

2) **Google Gemini（图生图/重绘）**  
   - 上游：Google Generative Language API `models/{modelId}:generateContent`（返回 inlineData 图片）  
   - 实际模型 ID：  
     - `gemini-3.1-flash-image-preview`（对应前端 `auto`/`standard`）  
     - `gemini-3-pro-image-preview`（对应前端 `pro`）  
   - 前端：`/workspace/image-to-image`（提供 model 下拉）  
   - 成本：**2/3/4 credits/次**（随 model 选项变化）

另外，代码里存在“视频生成”入口，但目前后端是 **coming soon stub**（不会调用上游视频模型，也不会扣费）。

---

## 2. 模型 ↔ 前端页面 ↔ 成本 对照表

| 场景 | 前端页面 | 前端 model 选项 | 后端实际上游模型 | 后端扣费（credits） | 调用入口 |
|---|---|---|---|---:|---|
| 文生图（T2I） | `app/generate/page.tsx` | 无（固定） | Volcengine Seed 2.0：`text2image_v2` + `general_v2.0` | 1 | `POST /api/generate` 且 `type=image` |
| 图生图（I2I） | `app/workspace/image-to-image/page.tsx` | `standard`（Standard / Fast） | `gemini-3.1-flash-image-preview` | 2 | `POST /api/generate` 且请求体包含 `imageBase64` |
| 图生图（I2I） | `app/workspace/image-to-image/page.tsx` | `auto`（Auto Balanced） | `gemini-3.1-flash-image-preview` | 3 | 同上 |
| 图生图（I2I） | `app/workspace/image-to-image/page.tsx` | `pro`（Pro / High Quality） | `gemini-3-pro-image-preview` | 4 | 同上 |
| 视频（stub） | `app/generate/page.tsx` | 无 | 未接入（返回 coming soon） | 前端显示 10，但后端实际不扣 | `POST /api/generate` 且 `type=video` |

---

## 3. 调用方式（后端实现细节）

### 3.1 文生图（Volcengine Seed 2.0）

**分流条件**  
`POST /api/generate` 的 JSON 体不含 `imageBase64`，并且 `type==="image"`。

**请求构造**（`lib/volcengine.ts`）
- Endpoint：`https://cv.{VOLC_REGION}.volces.com/?Action=CVProcess&Version=2022-08-31`
- 鉴权：自实现的 `HMAC-SHA256` 签名（`Authorization` + `X-Date` + `Host`）
- Body 关键字段：
  - `req_key: "text2image_v2"`
  - `model_version: "general_v2.0"`
  - `prompt`
  - `aspect_ratio`
  - `scale`
  - `seed`

**结果处理**
1. Volcengine 返回临时 `image_url`（或 `binary_data_base64`）  
2. 服务端 `downloadImage()` 把临时 URL 下载成 `Buffer`  
3. 上传 ImgBB（`uploadToImgBB(imageBuffer, { expiration: 7 days })`）得到公网 URL  
4. 写入 Supabase `generations`（不写入 model_id/aspect_ratio 字段）  

**扣费**
- 统一按 `CREDIT_COST.image = 1` 扣费（RPC：`deduct_credits`），异常会在 catch 中触发退款（RPC：`add_credits`）。

### 3.2 图生图（Gemini Image Preview）

**分流条件**  
`POST /api/generate` 的 JSON 体包含 `imageBase64: string` → 直接走 `handleGeminiImageToImage()`，不再读取 `type` 字段。

**请求构造**（`app/api/generate/route.ts`）
- Endpoint：`https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent?key={GEMINI_API_KEY}`
- 网络：使用 `node-fetch`；支持代理环境变量（`GEMINI_PROXY_URL`/`HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY`）
- Payload 结构：
  - `contents[0].parts[0].text`：把用户 prompt 拼成中文指令（包含 ratio 文本）
  - `contents[0].parts[1].inlineData`：上传的原图（mimeType + base64）

**模型选择**
- 前端传 `model`：`auto|standard|pro`  
- 后端映射到 `MODEL_MAP`：
  - `standard` / `auto` → `gemini-3.1-flash-image-preview`
  - `pro` → `gemini-3-pro-image-preview`

**结果解析**
- 从 `candidates[].content.parts[].inlineData.data` 抽取图片 base64。

**存储**
1. 结果图片 base64 → 上传 ImgBB（这里使用 `fetch` + `FormData`，未显式设置 expiration，默认永久）  
2. 写入 Supabase `generations`，优先写入字段：
   - `model_id: modelId`
   - `aspect_ratio: ratio`
   - 若表结构不包含这些字段，则 fallback 到旧字段集写入

**扣费**
- 扣费使用 `MODEL_COST_MAP`（RPC：`deduct_credits`）：`standard=2`、`auto=3`、`pro=4`  
- 任意失败路径（上游失败/无图/ImgBB 上传失败/DB 写入失败等）多数会触发 `refundCredits()` 退款。

---

## 4. 成本说明（credits 与美元换算）

### 4.1 代码内“扣费成本”（决定用户扣多少 credits）

- 文生图（Volcengine）：**1 credit/张**
- 图生图（Gemini）：**2/3/4 credits/次**（Standard/Auto/Pro）

### 4.2 credits 与美元的换算（由 Stripe 购买包决定）

当前 `lib/stripe.ts` 定义了 3 个一次性购买包（以美元计价）：

- Starter：$9.99 / 100 credits → **$0.0999/credit**
- Popular：$39.99 / 500 credits → **$0.07998/credit**
- Pro：$69.99 / 1000 credits → **$0.06999/credit**

据此可估算一次生成对用户的“售价”（不等于上游真实云成本）：

- 1 credit（文生图）：约 **$0.07 ~ $0.10**
- 2 credits（I2I Standard）：约 **$0.14 ~ $0.20**
- 3 credits（I2I Auto）：约 **$0.21 ~ $0.30**
- 4 credits（I2I Pro）：约 **$0.28 ~ $0.40**

---

## 5. 前端页面：哪些地方展示/选择 model

### 5.1 `/generate`（基础生成页）
- 文件：`app/generate/page.tsx`
- 行为：只提交 `type/prompt/aspectRatio`，**没有 model 下拉**  
- 结果：命中文生图（Volcengine）链路

### 5.2 `/workspace/image-to-image`（重绘页）
- 文件：`app/workspace/image-to-image/page.tsx`
- 行为：提交 `prompt/ratio/model/imageMimeType/imageBase64`  
- UI：`MODELS` 下拉（`auto|standard|pro`）与 cost 展示  
- 结果：命中图生图（Gemini）链路

### 5.3 `/workspace/my-creations`（历史页）
- 文件：`app/workspace/my-creations/page.tsx`
- 行为：优先显示 DB 中 `model_name/model_id/model`；若为空则用硬编码兜底字符串（可能与真实上游不一致）

---

## 6. 关键代码位置索引（便于快速跳转）

### 后端
- `app/api/generate/route.ts`  
  - Gemini 模型映射：`MODEL_MAP`（`app/api/generate/route.ts:81`）  
  - Gemini 扣费映射：`MODEL_COST_MAP`（`app/api/generate/route.ts:88`）  
  - I2I 主流程：`handleGeminiImageToImage()`（`app/api/generate/route.ts:128`）  
  - I2I 分流入口（检测 `imageBase64`）：（`app/api/generate/route.ts:508`）  
  - 文生图/视频扣费常量：`CREDIT_COST`（`app/api/generate/route.ts:478`）  
  - 文生图调用 Volcengine：`generateImage(...)`（`app/api/generate/route.ts:637`）  
  - 文生图上传 ImgBB：`uploadToImgBB(...)`（`app/api/generate/route.ts:659`）  

- `lib/volcengine.ts`  
  - Action：`ACTION_TEXT_TO_IMAGE="CVProcess"`（`lib/volcengine.ts:20`）  
  - Service/Version/Endpoint：（`lib/volcengine.ts:14`、`lib/volcengine.ts:15`、`lib/volcengine.ts:17`）  
  - 上游模型参数：`req_key="text2image_v2"`、`model_version="general_v2.0"`（`lib/volcengine.ts:170`、`lib/volcengine.ts:172`）  
  - HMAC 签名与请求发送：`generateAuthHeaders(...)` / `generateImage(...)`（`lib/volcengine.ts:45`、`lib/volcengine.ts:156`）  

- `lib/imgbb.ts`  
  - ImgBB Key 与上传函数：`IMGBB_API_KEY` / `uploadToImgBB(...)`（`lib/imgbb.ts:17`、`lib/imgbb.ts:58`）  

### 前端
- `app/workspace/image-to-image/page.tsx`  
  - `MODELS`（model 下拉与 cost）：（`app/workspace/image-to-image/page.tsx:45`）  
  - 三个选项 id：`auto/standard/pro`（`app/workspace/image-to-image/page.tsx:47`、`app/workspace/image-to-image/page.tsx:53`、`app/workspace/image-to-image/page.tsx:59`）  
  - 调用 `/api/generate`（携带 `model` 与 `imageBase64`）：（`app/workspace/image-to-image/page.tsx:1088`）  

- `app/generate/page.tsx`  
  - 调用 `/api/generate`（携带 `type`、`aspectRatio`）：（`app/generate/page.tsx:28`）  

### 计价/售卖
- `lib/stripe.ts`  
  - `CREDIT_PACKAGES`（credits 售价与换算）：（`lib/stripe.ts:13`）  

---

## 7. 已发现的不一致/注意点（不改代码，仅提示）

1) `app/pricing/page.tsx` 的文案写“Each image generation costs 1 credit”，但 I2I 实际是 2/3/4 credits。  
2) `supabase_schema.sql` 的 `generations` 表定义不包含 `model_id`、`aspect_ratio` 字段，但 Gemini 链路会尝试写入并做 fallback。  
3) Gemini 链路里：未知的 `model` 值会落到 `MODEL_MAP.default`（flash 模型），但扣费回退是 `MODEL_COST_MAP.auto`（3 credits），存在“模型与扣费不严格一致”的可能。  
4) Volcengine 链路上传 ImgBB 设置了 7 天过期；Gemini 链路上传 ImgBB 未设置过期（通常是永久），两条链路的存储策略不同。  
5) Gemini 请求日志里包含 `imageBase64Preview`、prompt 长度等信息；如用于生产环境，需评估隐私与日志合规。
