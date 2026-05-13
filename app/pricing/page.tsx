"use client";

import { useState } from "react";
import Link from "next/link";
import { CREDIT_PACKAGES, type PackageType } from "@/lib/stripe";

const paddleSkuByPackage: Record<PackageType, string> = {
  starter: "credits_starter",
  popular: "credits_popular",
  pro: "credits_pro",
};

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
          successUrl: `${window.location.origin}/dashboard?success=true&orderId=${data.orderId}`,
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Purchase Credits
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Choose the perfect plan for your AI generation needs
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {(Object.entries(CREDIT_PACKAGES) as [PackageType, typeof CREDIT_PACKAGES[PackageType]][]).map(
            ([key, pkg]) => (
              <div
                key={key}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  pkg.popular ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{pkg.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {pkg.priceFormatted}
                      </span>
                      <span className="ml-2 text-gray-600">
                        / {pkg.credits} credits
                      </span>
                    </div>
                    {pkg.discount && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                          {pkg.discount}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {pkg.credits} AI generation credits
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Image generation
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Video generation (coming soon)
                    </li>
                  </ul>

                  <button
                    onClick={() => handlePurchase(key)}
                    disabled={loading !== null}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      pkg.popular
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-800 hover:bg-gray-900 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === key ? "Processing..." : "Purchase"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How Credits Work
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Each image generation costs 1 credit</li>
              <li>• Each video generation costs 10 credits (coming soon)</li>
              <li>• Credits never expire</li>
              <li>• Secure payment processing via Paddle</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
