// Environment variable validation
// This file ensures all required environment variables are set

const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

// Optional environment variables (with defaults)
export const env = {
  ...requiredEnvVars,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Volcengine (optional for Phase 2, required for Phase 3)
  VOLC_ACCESS_KEY: process.env.VOLC_ACCESS_KEY,
  VOLC_SECRET_KEY: process.env.VOLC_SECRET_KEY,

  // Cloudflare R2 (optional for Phase 2, required for Phase 3)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN,

  // Gemini profile review
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  PROFILE_REVIEW_OBSERVATION_MODEL:
    process.env.PROFILE_REVIEW_OBSERVATION_MODEL || "gemini-2.5-flash-lite",
  PROFILE_REVIEW_REPORT_MODEL:
    process.env.PROFILE_REVIEW_REPORT_MODEL || "gemini-2.5-flash",
  GEMINI_TIMEOUT_MS: process.env.GEMINI_TIMEOUT_MS,
  GEMINI_PROXY_URL: process.env.GEMINI_PROXY_URL,

  // Email delivery
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  PROFILE_REVIEW_REPORT_FROM_EMAIL:
    process.env.PROFILE_REVIEW_REPORT_FROM_EMAIL,
  PROFILE_REVIEW_REPORT_REPLY_TO:
    process.env.PROFILE_REVIEW_REPORT_REPLY_TO,

  // Profile review business config
  PROFILE_REVIEW_UNLOCK_PRICE_USD:
    process.env.PROFILE_REVIEW_UNLOCK_PRICE_USD || "3.99",
  NEXT_PUBLIC_PROFILE_REVIEW_UNLOCK_PRICE_USD:
    process.env.NEXT_PUBLIC_PROFILE_REVIEW_UNLOCK_PRICE_USD ||
    process.env.PROFILE_REVIEW_UNLOCK_PRICE_USD ||
    "3.99",
  PROFILE_REVIEW_STORAGE_BUCKET:
    process.env.PROFILE_REVIEW_STORAGE_BUCKET || "profile-review-photos",
  PROFILE_REVIEW_MAX_UPLOAD_IMAGES:
    process.env.PROFILE_REVIEW_MAX_UPLOAD_IMAGES || "9",
  PROFILE_REVIEW_SCORE_MAX: process.env.PROFILE_REVIEW_SCORE_MAX || "100",

  // Trigger.dev
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  TRIGGER_PROJECT_REF: process.env.TRIGGER_PROJECT_REF,
};

// Validate required environment variables
export function validateEnv() {
  const missing: string[] = [];

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\n📝 Please check your .env.local file');
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

// Check if Volcengine is configured (for Phase 3)
export function isVolcengineConfigured(): boolean {
  return !!(env.VOLC_ACCESS_KEY && env.VOLC_SECRET_KEY);
}

// Check if R2 is configured (for Phase 3)
export function isR2Configured(): boolean {
  return !!(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME &&
    env.R2_PUBLIC_DOMAIN
  );
}
