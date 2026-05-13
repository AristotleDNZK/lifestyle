export type PackageType = "starter" | "popular" | "pro";

export const CREDIT_PACKAGES = {
  starter: {
    credits: 100,
    price: 999,
    priceFormatted: "$9.99",
    name: "Starter Pack",
    description: "Perfect for trying out the platform",
    popular: false,
    discount: undefined,
  },
  popular: {
    credits: 500,
    price: 3999,
    priceFormatted: "$39.99",
    name: "Popular Pack",
    description: "Best value for regular users",
    popular: true,
    discount: "20% OFF",
  },
  pro: {
    credits: 1000,
    price: 6999,
    priceFormatted: "$69.99",
    name: "Pro Pack",
    description: "For power users and professionals",
    popular: false,
    discount: "30% OFF",
  },
} as const;

export function getPackageDetails(packageType: PackageType) {
  return CREDIT_PACKAGES[packageType];
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getCostPerCredit(packageType: PackageType): number {
  const pkg = CREDIT_PACKAGES[packageType];
  return pkg.price / pkg.credits;
}
