import Stripe from "stripe";
export {
  CREDIT_PACKAGES,
  formatPrice,
  getCostPerCredit,
  getPackageDetails,
  type PackageType,
} from "@/lib/credit-packages";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  return stripeClient;
}
