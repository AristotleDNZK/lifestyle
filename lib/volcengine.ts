import crypto from "crypto";

/**
 * Volcengine Seed 2.0 API Client
 * Handles Text-to-Image generation using Doubao-Image (火山引擎视觉智能)
 */

// Volcengine Configuration
const VOLC_ACCESS_KEY = process.env.VOLC_ACCESS_KEY!;
const VOLC_SECRET_KEY = process.env.VOLC_SECRET_KEY!;
const VOLC_REGION = process.env.VOLC_REGION || "cn-north-1";

// API Endpoints
const SERVICE_NAME = "cv"; // Computer Vision service
const API_VERSION = "2022-08-31";
const HOST = `${SERVICE_NAME}.${VOLC_REGION}.volces.com`;
const ENDPOINT = `https://${HOST}`;

// Image generation action
const ACTION_TEXT_TO_IMAGE = "CVProcess";

/**
 * Generate HMAC-SHA256 signature for Volcengine API
 */
function generateSignature(
  stringToSign: string,
  secretKey: string
): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(stringToSign)
    .digest("hex");
}

/**
 * Get current timestamp in ISO 8601 format
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Generate authentication headers for Volcengine API
 */
function generateAuthHeaders(
  method: string,
  path: string,
  query: Record<string, string>,
  body: string
): Record<string, string> {
  const timestamp = getTimestamp();
  const date = timestamp.split("T")[0].replace(/-/g, "");

  // Canonical request components
  const canonicalQueryString = Object.keys(query)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join("&");

  const canonicalHeaders = `host:${HOST}\nx-date:${timestamp}\n`;
  const signedHeaders = "host;x-date";

  const hashedPayload = crypto
    .createHash("sha256")
    .update(body)
    .digest("hex");

  const canonicalRequest = [
    method,
    path,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  // String to sign
  const credentialScope = `${date}/${VOLC_REGION}/${SERVICE_NAME}/request`;
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  const stringToSign = [
    "HMAC-SHA256",
    timestamp,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // Calculate signature
  const kDate = crypto
    .createHmac("sha256", VOLC_SECRET_KEY)
    .update(date)
    .digest();
  const kRegion = crypto
    .createHmac("sha256", kDate)
    .update(VOLC_REGION)
    .digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update(SERVICE_NAME)
    .digest();
  const kSigning = crypto
    .createHmac("sha256", kService)
    .update("request")
    .digest();
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  // Authorization header
  const authorization = `HMAC-SHA256 Credential=${VOLC_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    "Content-Type": "application/json",
    "X-Date": timestamp,
    Authorization: authorization,
    Host: HOST,
  };
}

/**
 * Aspect Ratio type for image generation
 */
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

/**
 * Image generation request parameters
 */
export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: AspectRatio;
  seed?: number;
  scale?: number; // CFG Scale (1-20)
  stylePreset?: string;
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  requestId?: string;
}

/**
 * Generate image using Volcengine Seed 2.0 API
 *
 * @param params - Image generation parameters
 * @returns Promise with image URL or error
 */
export async function generateImage(
  params: ImageGenerationParams
): Promise<ImageGenerationResponse> {
  try {
    const {
      prompt,
      aspectRatio = "1:1",
      seed,
      scale = 7.5,
      stylePreset,
    } = params;

    // Build request body for CVProcess action
    const requestBody = {
      req_key: "text2image_v2", // Seed 2.0 API key
      prompt: prompt,
      model_version: "general_v2.0", // Seed 2.0 model
      aspect_ratio: aspectRatio,
      scale: scale,
      seed: seed || Math.floor(Math.random() * 2147483647),
      ...(stylePreset && { style_preset: stylePreset }),
    };

    const body = JSON.stringify(requestBody);

    // Query parameters
    const query = {
      Action: ACTION_TEXT_TO_IMAGE,
      Version: API_VERSION,
    };

    // Generate authentication headers
    const headers = generateAuthHeaders("POST", "/", query, body);

    // Make API request
    const queryString = Object.entries(query)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    const url = `${ENDPOINT}/?${queryString}`;

    console.log("Calling Volcengine API:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const data = await response.json();

    console.log("Volcengine API response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        success: false,
        error: data.ResponseMetadata?.Error?.Message || "API request failed",
        requestId: data.ResponseMetadata?.RequestId,
      };
    }

    // Extract image URL from response
    // Note: Volcengine returns a temporary URL that needs to be downloaded
    const imageUrl =
      data.data?.image_url || data.data?.binary_data_base64;

    if (!imageUrl) {
      return {
        success: false,
        error: "No image URL in response",
        requestId: data.ResponseMetadata?.RequestId,
      };
    }

    return {
      success: true,
      imageUrl: imageUrl,
      requestId: data.ResponseMetadata?.RequestId,
    };
  } catch (error: any) {
    console.error("Volcengine API error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Download image from URL as binary buffer
 * Used to download temporary images from Volcengine before uploading to R2
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if Volcengine is configured
 */
export function isVolcengineConfigured(): boolean {
  return !!(VOLC_ACCESS_KEY && VOLC_SECRET_KEY);
}
