"use client";

import { useState } from "react";

interface PlanTier {
  id: string;
  sku: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  oldPrice: string;
  highlight?: boolean;
  features: string[];
}

const plans: PlanTier[] = [
  {
    id: "mini",
    sku: "sub_mini_monthly",
    name: "Mini Plan",
    oldPrice: "$15.00",
    monthlyPrice: "$9.00",
    yearlyPrice: "$5.40",
    features: [
      "500 monthly credits",
      "AI photo optimization",
      "Profile-ready image output",
      "Commercial usage rights",
    ],
  },
  {
    id: "standard",
    sku: "sub_standard_monthly",
    name: "Standard Plan",
    oldPrice: "$50.00",
    monthlyPrice: "$30.00",
    yearlyPrice: "$18.00",
    highlight: true,
    features: [
      "1000 monthly credits",
      "Higher quality photo output",
      "Fast generation queue",
      "Priority support",
    ],
  },
  {
    id: "plus",
    sku: "sub_plus_monthly",
    name: "Plus Plan",
    oldPrice: "$99.00",
    monthlyPrice: "$60.00",
    yearlyPrice: "$36.00",
    features: [
      "2500 monthly credits",
      "Top quality photo models",
      "Advanced prompt controls",
      "Commercial team usage",
    ],
  },
];

function CheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1b492b] text-[10px] font-bold text-[#79f79a]">
      OK
    </span>
  );
}

export default function WorkspacePricingPage() {
  const [loadingSku, setLoadingSku] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = async (sku: string) => {
    try {
      setLoadingSku(sku);

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (!window.Paddle) {
        throw new Error("Paddle checkout is still loading. Please try again in a moment.");
      }

      window.Paddle?.Checkout.open({
        items: [{ priceId: data.paddlePriceId, quantity: 1 }],
        customData: data.customData,
        customer: data.email ? { email: data.email } : undefined,
        settings: {
          successUrl: `${window.location.origin}/workspace/account?success=true&orderId=${data.orderId}`,
        },
      });
    } catch (error) {
      console.error("Paddle subscription checkout failed:", error);
      alert(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setLoadingSku(null);
    }
  };

  return (
    <>
      <header className="border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">Workspace</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">DatingPhotosAI Pricing Plans</h1>
        <p className="mt-1 text-white/55">Choose a plan and start optimizing dating profile photos.</p>
      </header>

      <div className="mt-6 inline-flex items-center rounded-full border border-white/10 bg-[#0f141c] p-1 text-sm">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`rounded-full px-4 py-1.5 transition ${
            billingCycle === "monthly"
              ? "bg-white/10 text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle("yearly")}
          className={`rounded-full px-4 py-1.5 transition ${
            billingCycle === "yearly"
              ? "bg-white/10 text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          Yearly
        </button>
        <span className="ml-2 rounded-full bg-[#202020] px-2 py-0.5 text-xs text-[#d4d4d8]">40% OFF</span>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`rounded-xl border p-5 ${
              plan.highlight
                ? "border-[#e5e5e5]/70 bg-[#121212] "
                : "border-white/10 bg-[#0e1218]"
            }`}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              {plan.highlight ? (
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">
                  Popular
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-sm text-white/35 line-through">{plan.oldPrice}</span>
              <span className="text-base font-semibold leading-none tracking-tight text-white">
                {billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
              </span>
              <span className="mb-2 text-sm text-white/50">/month</span>
            </div>
            <p className="mt-2 text-xs text-white/45">
              billed {billingCycle}
            </p>

            <ul className="mt-4 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleSubscribe(plan.sku)}
              disabled={loadingSku !== null}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                plan.highlight
                  ? "bg-[#e5e5e5] text-[#0e1213] hover:bg-[#f1f1f1]"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {loadingSku === plan.sku
                ? "Starting checkout..."
                : `Subscribe to ${plan.name.replace(" Plan", "")}`}
            </button>
            <p className="mt-2 text-center text-xs text-white/40">
              Subscription billed {billingCycle}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12 max-w-4xl">
        <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
        <p className="mt-1 text-white/55">Everything you need to know about our pricing and plans.</p>
        <div className="mt-5 divide-y divide-white/10 rounded-xl border border-white/10 bg-[#121212]">
          {[
            "What are credits and how do they work?",
            "Can I upgrade or downgrade my plan anytime?",
            "Which payment methods do you accept?",
            "Can I use generated photos commercially?",
            "How long does generation usually take?",
          ].map((question) => (
            <div key={question} className="flex items-center justify-between px-4 py-3 text-sm text-white/75">
              <span>{question}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
