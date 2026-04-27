import Link from "next/link";
import { companyBusinessProfile, formatCompanyAddress } from "@/lib/company/business-profile";

const policySections = [
  {
    title: "30-Day Refund Window",
    body:
      "Cattle Guard Forms offers a full refund within 30 days of purchase for eligible CowStop reusable concrete cattle guard form orders. To request a refund, contact support within 30 days of your purchase date and include your order number, customer name, email address, and reason for return.",
  },
  {
    title: "Return Shipping Responsibility",
    body:
      "Customers are responsible for arranging and paying return shipping back to the factory in Indiana unless Cattle Guard Forms confirms in writing that a different return arrangement applies. Return freight must be properly packaged and shipped in a way that protects the returned form during transit.",
  },
  {
    title: "Return Condition",
    body:
      "Returned products should be sent back in reasonable condition with all included components and order-identifying information. If a product is damaged during return transit due to inadequate packaging or carrier handling, the refund may be delayed while the shipment is reviewed.",
  },
  {
    title: "Refund Timing",
    body:
      "Once the return is received and reviewed, approved refunds are issued back to the original payment method when possible. Bank and card processor timing may vary after Cattle Guard Forms submits the refund.",
  },
  {
    title: "Shipping Charges and Freight Costs",
    body:
      "Outbound shipping, freight, accessorial fees, liftgate fees, limited-access fees, residential delivery charges, insurance charges, and return shipping costs may be handled separately from the product refund unless Cattle Guard Forms confirms otherwise in writing.",
  },
  {
    title: "How to Start a Return",
    body:
      `Email ${companyBusinessProfile.supportEmail} or use the contact form before shipping any item back. We will provide the correct return instructions, return destination, and order reference information so the return can be matched to your purchase.`,
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/shipping-policy" className="hover:text-green-800">Shipping</Link>
            <Link href="/privacy-policy" className="hover:text-green-800">Privacy</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Customer Policy</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Refund and Return Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: April 27, 2026</p>
        <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">
          Cattle Guard Forms offers a full refund within 30 days of purchase for eligible returned products. Customers are responsible for return shipping back to the factory in Indiana.
        </div>

        <div className="mt-10 space-y-8">
          {policySections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-8 text-neutral-700">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-neutral-50 p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Contact for Returns</h2>
          <p className="mt-3 leading-7 text-neutral-700">
            Email <a className="font-semibold text-green-800 underline" href={`mailto:${companyBusinessProfile.supportEmail}`}>{companyBusinessProfile.supportEmail}</a> before sending any return shipment.
          </p>
          <address className="mt-4 whitespace-pre-line text-sm leading-6 text-neutral-700 not-italic">
            {formatCompanyAddress()}
          </address>
        </section>
      </section>
    </main>
  );
}
