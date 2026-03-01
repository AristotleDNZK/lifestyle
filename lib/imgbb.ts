/**
 * ImgBB Universal Image Upload
 *
 * 支持所有 AI 模型的图片格式：
 * - Base64 字符串
 * - HTTP URL
 * - Buffer
 * - Data URL (data:image/png;base64,...)
 *
 * 免费额度：
 * - 无限存储
 * - 无限流量
 * - 32MB 单文件限制
 * - 5000 上传/小时
 */

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBUploadOptions {
  /** 过期时间（秒）。0 = 永久，60-15552000 = 自定义天数 */
  expiration?: number;
  /** 图片名称（可选） */
  name?: string;
}

export interface ImgBBUploadResult {
  url: string;
  deleteUrl: string;
  size: number;
  expiresAt: Date | null;
}

/**
 * 通用图片上传函数
 *
 * @param imageData - 图片数据（支持多种格式）
 * @param options - 上传选项
 * @returns 上传结果（包含永久URL）
 *
 * @example
 * // 上传 Base64
 * const result = await uploadToImgBB('iVBORw0KGgoAAAANS...');
 *
 * @example
 * // 上传 URL（自动下载后上传）
 * const result = await uploadToImgBB('https://example.com/image.png');
 *
 * @example
 * // 上传 Buffer
 * const buffer = await fs.readFile('image.png');
 * const result = await uploadToImgBB(buffer);
 *
 * @example
 * // 设置 7 天过期
 * const result = await uploadToImgBB(imageData, { expiration: 7 * 24 * 60 * 60 });
 */
export async function uploadToImgBB(
  imageData: string | Buffer,
  options: ImgBBUploadOptions = {}
): Promise<ImgBBUploadResult> {
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY is not configured in .env.local');
  }

  let base64Data: string;

  try {
    // 处理不同的输入格式
    if (Buffer.isBuffer(imageData)) {
      // Buffer → Base64
      base64Data = imageData.toString('base64');
    } else if (imageData.startsWith('data:image')) {
      // Data URL → Base64
      base64Data = imageData.split(',')[1];
    } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // HTTP URL → 下载 → Base64
      console.log('Downloading image from URL:', imageData);
      const response = await fetch(imageData);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      // 假设已经是纯 Base64
      base64Data = imageData;
    }

    // 构建表单数据
    const formData = new URLSearchParams({
      key: IMGBB_API_KEY,
      image: base64Data,
    });

    // 添加可选参数
    if (options.expiration !== undefined) {
      formData.append('expiration', options.expiration.toString());
    }
    if (options.name) {
      formData.append('name', options.name);
    }

    // 上传到 ImgBB
    console.log('Uploading to ImgBB...');
    const uploadResponse = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await uploadResponse.json();

    if (!result.success) {
      throw new Error(`ImgBB upload failed: ${result.error?.message || 'Unknown error'}`);
    }

    // 解析结果
    const { data } = result;

    return {
      url: data.url,
      deleteUrl: data.delete_url,
      size: data.size,
      expiresAt: data.expiration ? new Date(data.expiration * 1000) : null,
    };
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw new Error(`Failed to upload image to ImgBB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 预设的过期时间常量
 */
export const EXPIRATION = {
  /** 永久保存 */
  PERMANENT: 0,
  /** 1 小时 */
  ONE_HOUR: 60 * 60,
  /** 1 天 */
  ONE_DAY: 24 * 60 * 60,
  /** 3 天 */
  THREE_DAYS: 3 * 24 * 60 * 60,
  /** 7 天 */
  SEVEN_DAYS: 7 * 24 * 60 * 60,
  /** 30 天 */
  THIRTY_DAYS: 30 * 24 * 60 * 60,
} as const;

/**
 * 批量上传图片
 */
export async function uploadMultipleToImgBB(
  images: (string | Buffer)[],
  options: ImgBBUploadOptions = {}
): Promise<ImgBBUploadResult[]> {
  const uploadPromises = images.map(image => uploadToImgBB(image, options));
  return Promise.all(uploadPromises);
}
