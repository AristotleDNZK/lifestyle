export type BillingProductType = "credits" | "subscription" | "profile_review_unlock";

export type BillingSku =
  | "credits_starter"
  | "credits_popular"
  | "credits_pro"
  | "sub_mini_monthly"
  | "sub_standard_monthly"
  | "sub_plus_monthly"
  | "profile_review_unlock";

export interface BillingCatalogItem {
  sku: BillingSku;
  productType: BillingProductType;
  name: string;
  description: string;
  amount: number;
  currency: "usd";
  credits?: number;
  monthlyCredits?: number;
  interval?: "month";
  paddlePriceEnv: string;
}

export const BILLING_CATALOG: Record<BillingSku, BillingCatalogItem> = {
  credits_starter: {
    sku: "credits_starter",
    productType: "credits",
    name: "Starter Pack",
    description: "Perfect for trying out the platform",
    amount: 999,
    currency: "usd",
    credits: 100,
    paddlePriceEnv: "PADDLE_PRICE_CREDITS_STARTER",
  },
  credits_popular: {
    sku: "credits_popular",
    productType: "credits",
    name: "Popular Pack",
    description: "Best value for regular users",
    amount: 3999,
    currency: "usd",
    credits: 500,
    paddlePriceEnv: "PADDLE_PRICE_CREDITS_POPULAR",
  },
  credits_pro: {
    sku: "credits_pro",
    productType: "credits",
    name: "Pro Pack",
    description: "For power users and professionals",
    amount: 6999,
    currency: "usd",
    credits: 1000,
    paddlePriceEnv: "PADDLE_PRICE_CREDITS_PRO",
  },
  sub_mini_monthly: {
    sku: "sub_mini_monthly",
    productType: "subscription",
    name: "Mini Plan",
    description: "500 monthly credits",
    amount: 900,
    currency: "usd",
    monthlyCredits: 500,
    interval: "month",
    paddlePriceEnv: "PADDLE_PRICE_SUB_MINI_MONTHLY",
  },
  sub_standard_monthly: {
    sku: "sub_standard_monthly",
    productType: "subscription",
    name: "Standard Plan",
    description: "1000 monthly credits",
    amount: 3000,
    currency: "usd",
    monthlyCredits: 1000,
    interval: "month",
    paddlePriceEnv: "PADDLE_PRICE_SUB_STANDARD_MONTHLY",
  },
  sub_plus_monthly: {
    sku: "sub_plus_monthly",
    productType: "subscription",
    name: "Plus Plan",
    description: "2500 monthly credits",
    amount: 6000,
    currency: "usd",
    monthlyCredits: 2500,
    interval: "month",
    paddlePriceEnv: "PADDLE_PRICE_SUB_PLUS_MONTHLY",
  },
  profile_review_unlock: {
    sku: "profile_review_unlock",
    productType: "profile_review_unlock",
    name: "Dating Profile Review Unlock",
    description: "Full access to the dating profile review report",
    amount: 399,
    currency: "usd",
    paddlePriceEnv: "PADDLE_PRICE_PROFILE_REVIEW_UNLOCK",
  },
};

export function getCatalogItem(sku: string) {
  const item = BILLING_CATALOG[sku as BillingSku];

  if (!item) {
    throw new Error(`Unknown billing SKU: ${sku}`);
  }

  return item;
}

export function getPaddlePriceId(
  sku: BillingSku,
  env: Record<string, string | undefined> = process.env
) {
  const item = getCatalogItem(sku);
  const priceId = env[item.paddlePriceEnv];

  if (!priceId) {
    throw new Error(`Missing Paddle price id env var ${item.paddlePriceEnv}`);
  }

  return priceId;
}

export function isOneTimeSku(sku: string) {
  return getCatalogItem(sku).productType !== "subscription";
}

export function isSubscriptionSku(sku: string) {
  return getCatalogItem(sku).productType === "subscription";
}
