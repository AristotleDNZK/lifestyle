import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | DatingPhotosAI",
  description: "Refund policy for DatingPhotosAI digital products, credits, subscriptions, and AI reports.",
};

const lastUpdated = "May 6, 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-8 text-white/68">
        {children}
      </div>
    </section>
  );
}

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[#06090e] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex rounded-sm border border-white/15 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-[#63f276]/55 hover:text-white"
        >
          Back to DatingPhotosAI
        </Link>

        <header className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#63f276]">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Refund Policy
          </h1>
          <p className="mt-5 text-base leading-8 text-white/64">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="mt-12 space-y-10">
          <Section title="1. Overview">
            <p>
              This Refund Policy applies to DatingPhotosAI digital products, including
              dating profile review unlocks, AI-generated image services,
              credits, subscriptions, and related digital access. It should be
              read together with our Terms and Conditions and Privacy Policy.
            </p>
            <p>
              Paddle is our online reseller and Merchant of Record. Paddle may
              handle payment-related customer service inquiries and returns for
              eligible orders.
            </p>
          </Section>

          <Section title="2. 30-day refund request window">
            <p>
              Unless a longer period is required by applicable law, refund
              requests should be submitted within 30 days of the original
              purchase date. Approval depends on the product type, delivery
              status, usage, legal requirements, and payment-provider rules.
            </p>
          </Section>

          <Section title="3. Digital product delivery">
            <p>
              DatingPhotosAI products are digital product services delivered through the
              website after purchase. Because digital reports, credits,
              subscriptions, and generated outputs can be accessed or consumed
              immediately, completed and used purchases are generally not
              refundable unless required by law or unless there is a verified
              delivery or billing issue.
            </p>
          </Section>

          <Section title="4. Eligible refund situations">
            <p>
              We may approve a full or partial refund when a duplicate charge
              occurred, the purchased product was not delivered, paid credits
              were not added, a subscription renewal was charged after a valid
              cancellation, a material technical failure prevented use, or a
              refund is required by applicable consumer law.
            </p>
            <p>
              If AI generation fails and credits were deducted, we may restore
              the credits, retry the generation, provide equivalent access, or
              coordinate a refund where appropriate.
            </p>
          </Section>

          <Section title="5. Situations usually not eligible">
            <p>
              Refunds are usually not available for fully delivered and used
              digital reports, consumed credits, generated images that match the
              purchased service description, dissatisfaction with subjective AI
              style, failure to achieve dating results, violation of our Terms,
              or requests made outside the refund request window.
            </p>
          </Section>

          <Section title="6. Subscriptions">
            <p>
              You may cancel a subscription to stop future renewals. Canceling a
              subscription does not automatically refund prior charges or the
              current billing period unless required by law or approved through
              support. If a subscription renews because it was not canceled
              before the renewal date, the renewal may be non-refundable unless
              local consumer law provides otherwise.
            </p>
          </Section>

          <Section title="7. How to request a refund">
            <p>
              To request a refund, contact Paddle buyer support through your
              Paddle receipt or Paddle order support channel, or contact DatingPhotosAI
              product support through the support contact published in your
              account or checkout receipt. Include the order ID, account email,
              purchase date, product purchased, and a clear description of the
              issue.
            </p>
            <p>
              Approved refunds are returned to the original payment method when
              possible. Bank and payment-network processing times may vary.
            </p>
          </Section>

          <Section title="8. Legal rights">
            <p>
              Nothing in this policy limits any mandatory consumer rights that
              apply in your country or region. Where local law gives you
              stronger rights than this policy, those rights apply.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

