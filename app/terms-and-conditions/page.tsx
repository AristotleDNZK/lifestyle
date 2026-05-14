import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | DatingPhotosAI",
  description: "Terms and conditions for using DatingPhotosAI AI dating profile review and AI photo services.",
};

const lastUpdated = "May 6, 2026";
const paddleMerchantOfRecordDisclosure =
  "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.";

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

export default function TermsAndConditionsPage() {
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
            Terms and Conditions
          </h1>
          <p className="mt-5 text-base leading-8 text-white/64">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="mt-12 space-y-10">
          <Section title="1. Service provider and scope">
            <p>
              DatingPhotosAI provides digital software services for AI-powered dating
              profile review, profile recommendations, image generation, and
              related account features. These Terms govern your access to and
              use of the website, checkout flows, reports, credits,
              subscriptions, generated content, and other digital services
              provided by DatingPhotosAI.
            </p>
            <p>
              By creating an account, uploading content, purchasing a product,
              or using the service, you agree to these Terms, our Privacy
              Policy, and our Refund Policy.
            </p>
          </Section>

          <Section title="2. Paddle Merchant of Record disclosure">
            <p>{paddleMerchantOfRecordDisclosure}</p>
            <p>
              Paddle may collect payment details, calculate applicable taxes,
              issue invoices, provide buyer support for payment-related
              questions, and process refunds or chargebacks according to
              Paddle&apos;s buyer terms and applicable law.
            </p>
          </Section>

          <Section title="3. Accounts and eligibility">
            <p>
              You must provide accurate account and contact information. You are
              responsible for maintaining the confidentiality of your account
              credentials and for all activity that occurs under your account.
            </p>
            <p>
              You may not use the service if you are prohibited from doing so
              under applicable law or if your use would violate platform,
              payment, sanctions, or acceptable-use restrictions.
            </p>
          </Section>

          <Section title="4. Digital products, credits, and subscriptions">
            <p>
              DatingPhotosAI sells digital access, reports, usage-based credits, and
              subscription plans. Credits are internal usage units used only
              inside DatingPhotosAI. Credits are not money, stored value, gift cards, or
              financial instruments. Credits cannot be withdrawn, transferred,
              resold, redeemed for cash, or exchanged outside the service.
            </p>
            <p>
              Subscription plans renew automatically unless canceled before the
              next billing date. Checkout pages must clearly show the product,
              price, billing interval, and what the buyer receives before
              purchase.
            </p>
          </Section>

          <Section title="5. User content and generated outputs">
            <p>
              You may upload photos, profile text, answers, prompts, and other
              content for analysis or generation. You represent that you have
              the necessary rights and permissions to upload and process that
              content, including images of any person shown in the content.
            </p>
            <p>
              You remain responsible for how you use generated outputs. You
              must not use DatingPhotosAI to create illegal, harmful, deceptive,
              infringing, sexually exploitative, or non-consensual content, or
              to impersonate another person.
            </p>
          </Section>

          <Section title="6. AI limitations">
            <p>
              AI reports, scores, recommendations, and generated images may be
              inaccurate, incomplete, or unsuitable for a specific situation.
              DatingPhotosAI does not guarantee matches, dates, income, employment,
              relationship outcomes, or any other real-world result.
            </p>
            <p>
              Dating platform rules may change. You are responsible for
              reviewing and following the rules of any third-party platform
              where you choose to use your content.
            </p>
          </Section>

          <Section title="7. Fulfillment and support">
            <p>
              After a successful payment, DatingPhotosAI will make the purchased digital
              product, credits, subscription access, or unlocked report
              available through your account or checkout session. If fulfillment
              fails, contact support so we can investigate, restore access,
              retry delivery, add missing credits, or coordinate a refund where
              appropriate.
            </p>
            <p>
              Product support is available through the contact details published
              on the website. Payment, invoice, tax, and refund support may also
              be handled by Paddle as Merchant of Record.
            </p>
          </Section>

          <Section title="8. Acceptable use">
            <p>
              You may not abuse the service, bypass security controls, reverse
              engineer protected systems, overload infrastructure, scrape
              private data, interfere with other users, or use the service for
              fraud, harassment, spam, malware, illegal activity, or payment
              abuse.
            </p>
            <p>
              We may suspend or terminate access if we reasonably believe your
              use creates legal, safety, payment, security, or platform risk.
            </p>
          </Section>

          <Section title="9. Changes and termination">
            <p>
              We may update the service and these Terms from time to time. The
              latest version will be posted on this page. Continued use after an
              update means you accept the updated Terms.
            </p>
            <p>
              You may stop using the service at any time. Subscription
              cancellation stops future renewals but does not automatically
              refund past charges unless required by law or approved under our
              Refund Policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For product support, use the support contact published in your
              account or checkout receipt. For payment, invoice, tax, and refund
              questions, use the buyer support link in your Paddle receipt.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

