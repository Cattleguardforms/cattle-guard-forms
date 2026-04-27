import Link from "next/link";
import { companyBusinessProfile, formatCompanyAddress } from "@/lib/company/business-profile";

const sections = [
  {
    title: "Information We Collect",
    body:
      "Cattle Guard Forms may collect information you provide through quote forms, contact forms, distributor forms, checkout, email communication, support requests, uploaded files, shipping details, and account or portal activity. This may include your name, email address, phone number, company, billing or shipping details, order details, project information, BOL information, and support messages.",
  },
  {
    title: "How We Use Information",
    body:
      "We use information to respond to inquiries, prepare quotes, process orders, coordinate shipping and freight, support distributors, communicate with manufacturers, manage customer records, operate the CRM/admin portals, send order and support emails, improve the website, prevent fraud, and comply with business or legal obligations.",
  },
  {
    title: "Payments",
    body:
      "Payment information is processed by our payment provider, such as Stripe. Cattle Guard Forms does not intentionally store full card numbers in our own database. Payment status, transaction references, checkout session IDs, and order-related payment information may be stored so we can manage orders and support requests.",
  },
  {
    title: "Shipping and Fulfillment",
    body:
      "Shipping and fulfillment information may be shared with carriers, shipping coordinators, Echo shipping-related tools, manufacturers, distributors, or service providers as needed to quote freight, arrange shipment, prepare BOL information, track delivery, and resolve delivery issues.",
  },
  {
    title: "Email and Communications",
    body:
      "We may send transactional emails related to quote requests, orders, payments, shipping updates, support requests, distributor communications, and important account or service notices. Marketing communications may be managed separately where applicable.",
  },
  {
    title: "Service Providers",
    body:
      "We may use third-party service providers for website hosting, database hosting, payments, email delivery, analytics, shipping, CRM operations, and business workflow automation. These providers process information only as needed to provide their services to Cattle Guard Forms.",
  },
  {
    title: "Data Security",
    body:
      "We use reasonable administrative, technical, and organizational safeguards to protect business and customer information. No online system can be guaranteed completely secure, so customers should avoid sending unnecessary sensitive information through open forms or email.",
  },
  {
    title: "Data Retention",
    body:
      "We keep customer, order, support, shipping, and business records for as long as needed to operate the business, provide support, comply with legal or accounting obligations, resolve disputes, and maintain accurate order history.",
  },
  {
    title: "Your Choices",
    body:
      "You may contact us to request updates or corrections to your contact information. Some records may need to be retained for order, accounting, legal, fraud prevention, or legitimate business purposes.",
  },
  {
    title: "Policy Updates",
    body:
      "We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised last updated date.",
  },
];

export default function PrivacyPolicyPage() {
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
            <Link href="/refund-policy" className="hover:text-green-800">Refunds</Link>
            <Link href="/shipping-policy" className="hover:text-green-800">Shipping</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: April 27, 2026</p>
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
          This Privacy Policy is a practical business draft for the website and should be reviewed by a qualified attorney before being relied on as final legal advice.
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-8 text-neutral-700">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-neutral-50 p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="mt-3 leading-7 text-neutral-700">
            For privacy questions, contact <a className="font-semibold text-green-800 underline" href={`mailto:${companyBusinessProfile.supportEmail}`}>{companyBusinessProfile.supportEmail}</a>.
          </p>
          <address className="mt-4 whitespace-pre-line text-sm leading-6 text-neutral-700 not-italic">
            {formatCompanyAddress()}
          </address>
        </section>
      </section>
    </main>
  );
}
