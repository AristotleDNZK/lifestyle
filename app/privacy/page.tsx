import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Roast",
  description: "Privacy policy for Roast AI dating profile review and AI photo services.",
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#080b09] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-sm border border-white/15 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-[#63f276]/55 hover:text-white"
        >
          Back to Roast
        </Link>

        <header className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#63f276]">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 text-base leading-8 text-white/64">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="mt-12 space-y-10">
          <Section title="1. Overview">
            <p>
              This Privacy Policy explains how Roast collects, uses, stores,
              shares, and protects information when you use our website,
              AI-powered dating profile review, AI image generation, account,
              billing, and support features.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>
              We may collect account information such as your name, email
              address, authentication identifiers, profile settings, plan,
              credit balance, subscription status, and support messages.
            </p>
            <p>
              We may collect content you choose to provide, including uploaded
              photos, dating profile screenshots, answers to profile questions,
              prompts, generated images, report outputs, and related metadata.
            </p>
            <p>
              We may collect technical data such as IP address, device and
              browser information, logs, referral pages, timestamps, security
              events, checkout events, and usage activity needed to operate and
              improve the service.
            </p>
          </Section>

          <Section title="3. Payments through Paddle">
            <p>
              Your payment is processed by Paddle, our online reseller and
              Merchant of Record. Paddle may collect billing details, payment
              method information, tax information, invoice details, transaction
              identifiers, and fraud-prevention signals.
            </p>
            <p>
              We do not store full card numbers, CVV codes, or full payment
              credentials on our servers. We receive limited payment and
              subscription information from Paddle so we can activate purchases,
              manage credits, provide access, reconcile transactions, prevent
              abuse, and support customers.
            </p>
          </Section>

          <Section title="4. How we use information">
            <p>
              We use information to provide the service, process uploads,
              generate reports and images, maintain accounts, deliver purchased
              digital products, manage credits and subscriptions, send product
              and support messages, detect abuse, secure the service, debug
              issues, and comply with legal obligations.
            </p>
            <p>
              We may use aggregated or de-identified data to understand product
              performance and improve prompts, quality controls, user flows, and
              reliability.
            </p>
          </Section>

          <Section title="5. AI processing and service providers">
            <p>
              To provide AI features, we may send your uploaded content,
              prompts, answers, and related context to AI model providers,
              storage providers, authentication providers, payment providers,
              email providers, hosting providers, analytics providers, and other
              infrastructure vendors that help operate the service.
            </p>
            <p>
              We require service providers to process information only for
              permitted business purposes and to protect information using
              appropriate safeguards.
            </p>
          </Section>

          <Section title="6. Storage, retention, and deletion">
            <p>
              We retain information for as long as needed to provide the
              service, maintain security, handle billing and disputes, comply
              with legal obligations, and resolve support requests. Uploaded
              content and generated outputs may be deleted, anonymized, or
              retained according to product requirements and account settings.
            </p>
            <p>
              You may request deletion of account or content data by contacting
              support. Some records may be retained where required for legal,
              tax, payment, fraud-prevention, or dispute-resolution purposes.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              We use reasonable technical and organizational safeguards designed
              to protect information against unauthorized access, loss, misuse,
              and alteration. No internet service can guarantee absolute
              security.
            </p>
          </Section>

          <Section title="8. Your choices">
            <p>
              Depending on your location, you may have rights to access,
              correct, delete, restrict, or export certain personal information,
              or to object to certain processing. You may also cancel
              subscriptions or manage buyer support through Paddle where
              applicable.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              For privacy requests, use the support contact published in your
              account or checkout receipt. For payment data handled by Paddle,
              use the buyer support or privacy request options provided by
              Paddle.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
