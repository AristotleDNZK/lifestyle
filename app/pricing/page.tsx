"use client";

import { useState } from "react";
import Link from "next/link";
import { CREDIT_PACKAGES, type PackageType } from "@/lib/credit-packages";

const paddleSkuByPackage: Record<PackageType, string> = {
  starter: "credits_starter",
  popular: "credits_popular",
  pro: "credits_pro",
};

function CheckIcon() {
  return (
    <svg
      className="mr-2 h-5 w-5 shrink-0 text-[#62f178]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<PackageType | null>(null);

  const handlePurchase = async (packageType: PackageType) => {
    setLoading(packageType);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sku: paddleSkuByPackage[packageType] }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (!window.Paddle) {
        throw new Error("Paddle checkout is still loading. Please try again in a moment.");
      }

      window.Paddle?.Checkout.open({
        items: [{ priceId: data.paddlePriceId, quantity: 1 }],
        customData: data.customData,
        customer: data.email ? { email: data.email } : undefined,
        settings: {
          successUrl: `${window.location.origin}/workspace/image-to-image?success=true&orderId=${data.orderId}`,
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="dpai-page dpai-radial-bg relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 dpai-grid-bg opacity-70" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-12 text-center">
          <p className="dpai-label text-[#62f178]">Billing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Purchase Credits
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/58">
            Choose the perfect plan for your AI generation needs.
          </p>
          <Link href="/workspace/image-to-image" className="dpai-secondary-btn mt-5">
            Back to Workspace
          </Link>
        </header>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {(Object.entries(CREDIT_PACKAGES) as [PackageType, typeof CREDIT_PACKAGES[PackageType]][]).map(
            ([key, pkg]) => (
              <article
                key={key}
                className={`overflow-hidden rounded-2xl border ${
                  pkg.popular
                    ? "border-[#58ef70]/70 bg-[linear-gradient(180deg,rgba(31,69,43,0.42),rgba(12,16,22,0.96))] shadow-[0_0_40px_rgba(87,240,109,0.18)]"
                    : "border-white/10 bg-[#0f1319]"
                }`}
              >
                {pkg.popular ? (
                  <div className="bg-[#5ef36f] py-2 text-center text-xs font-black uppercase tracking-[0.1em] text-[#071009]">
                    Most Popular
                  </div>
                ) : null}

                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-white">{pkg.name}</h2>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/56">
                    {pkg.description}
                  </p>

                  <div className="mt-5">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-semibold tracking-tight text-white">
                        {pkg.priceFormatted}
                      </span>
                      <span className="ml-2 text-sm text-white/50">
                        / {pkg.credits} credits
                      </span>
                    </div>
                    {pkg.discount ? (
                      <span className="mt-3 inline-block rounded-full border border-[#57f06d]/35 bg-[#102617] px-2 py-1 text-xs font-semibold text-[#8df6aa]">
                        {pkg.discount}
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-white/70">
                    <li className="flex items-center">
                      <CheckIcon />
                      {pkg.credits} AI generation credits
                    </li>
                    <li className="flex items-center">
                      <CheckIcon />
                      Image generation
                    </li>
                    <li className="flex items-center">
                      <CheckIcon />
                      Video generation (coming soon)
                    </li>
                  </ul>

                  <button
                    onClick={() => handlePurchase(key)}
                    disabled={loading !== null}
                    className={`mt-6 w-full rounded-md px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      pkg.popular
                        ? "bg-[#5ef36f] text-[#0b0d10] hover:bg-[#78ff88]"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {loading === key ? "Processing..." : "Purchase"}
                  </button>
                </div>
              </article>
            )
          )}
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <div className="dpai-panel p-6">
            <h2 className="text-lg font-semibold text-white">How Credits Work</h2>
            <ul className="mt-4 space-y-2 text-white/65">
              <li>Each image generation costs 1 credit</li>
              <li>Each video generation costs 10 credits (coming soon)</li>
              <li>Credits never expire</li>
              <li>Secure payment processing via Paddle</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
