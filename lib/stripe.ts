import Stripe from "stripe";

// Initialize Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// Credit package types
export type PackageType = "starter" | "popular" | "pro";

// Credit package configuration
export const CREDIT_PACKAGES = {
  starter: {
    credits: 100,
    price: 999, // $9.99 in cents
    priceFormatted: "$9.99",
    name: "Starter Pack",
    description: "Perfect for trying out the platform",
    popular: false,
    discount: undefined,
  },
  popular: {
    credits: 500,
    price: 3999, // $39.99 in cents
    priceFormatted: "$39.99",
    name: "Popular Pack",
    description: "Best value for regular users",
    popular: true,
    discount: "20% OFF",
  },
  pro: {
    credits: 1000,
    price: 6999, // $69.99 in cents
    priceFormatted: "$69.99",
    name: "Pro Pack",
    description: "For power users and professionals",
    popular: false,
    discount: "30% OFF",
  },
} as const;

// Helper function to get package details
export function getPackageDetails(packageType: PackageType) {
  return CREDIT_PACKAGES[packageType];
}

// Helper function to format cents to dollars
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Helper function to calculate per-credit cost
export function getCostPerCredit(packageType: PackageType): number {
  const pkg = CREDIT_PACKAGES[packageType];
  return pkg.price / pkg.credits;
}
