import Link from "next/link";
import { companyBusinessProfile, formatCompanyAddress } from "@/lib/company/business-profile";

const sections = [
  {
    title: "Freight-Based Shipping",
    body:
      "CowStop reusable concrete cattle guard forms are shipped as freight when delivery is requested. Freight may include palletized shipment, carrier handling, accessorial services, and delivery coordination. Shipping costs are quoted or confirmed separately from the product price unless a written quote or checkout summary states otherwise.",
  },
  {
    title: "Echo Shipping Coordination",
    body:
      "Cattle Guard Forms may use Echo shipping tools or Echo shipping coordination to help compare freight options, book shipment, and manage carrier communication. Available freight options may vary by destination, pallet count, carrier availability, service level, and delivery requirements.",
  },
  {
    title: "Good / Better / Best Freight Options",
    body:
      "When available, customers may request Good, Better, or Best freight options. These options are intended to help compare price, carrier quality, speed, and service level. Final carrier selection and pricing are subject to availability and confirmation.",
  },
  {
    title: "Accessorial Services",
    body:
      "Some deliveries may require additional services such as liftgate delivery, residential delivery, limited-access delivery, appointment delivery, call-before-delivery, or freight insurance. These services may increase the final freight cost and should be disclosed before shipment is booked.",
  },
  {
    title: "Customer-Arranged Freight or Pickup",
    body:
      "Some customers or distributors may arrange their own freight or pickup. If you arrange your own freight, you are responsible for providing accurate pickup information, carrier details, bill of lading instructions, and any required pickup coordination.",
  },
  {
    title: "Delivery Timing",
    body:
      "Shipping dates, estimated transit times, and delivery dates are estimates unless expressly confirmed in writing. Carrier delays, weather, access limitations, manufacturer readiness, freight scheduling, and incomplete delivery information can affect delivery timing.",
  },
  {
    title: "Inspection at Delivery",
    body:
      "Customers should inspect freight at delivery before signing the delivery receipt when possible. If there is visible damage, shortage, or carrier issue, note it with the carrier and contact Cattle Guard Forms support as soon as possible with photos and shipment details.",
  },
  {
    title: "BOL and Tracking Updates",
    body:
      "Bill of lading details, tracking numbers, PRO numbers, carrier information, pallet counts, and manufacturer shipment notes may be sent by email or updated in the order workflow when available.",
  },
];

export default function ShippingPolicyPage() {
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
            <Link href="/privacy-policy" className="hover:text-green-800">Privacy</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Customer Policy</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Shipping Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: April 27, 2026</p>
        <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">
          Cattle Guard Forms coordinates freight shipping for CowStop reusable concrete cattle guard forms, including Echo shipping-supported rate review and carrier coordination when available.
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
          <h2 className="text-2xl font-semibold">Shipping Support</h2>
          <p className="mt-3 leading-7 text-neutral-700">
            For shipping questions, freight changes, BOL questions, or delivery issues, email <a className="font-semibold text-green-800 underline" href={`mailto:${companyBusinessProfile.supportEmail}`}>{companyBusinessProfile.supportEmail}</a> or use the contact form.
          </p>
          <address className="mt-4 whitespace-pre-line text-sm leading-6 text-neutral-700 not-italic">
            {formatCompanyAddress()}
          </address>
        </section>
      </section>
    </main>
  );
}
