import Link from "next/link";

const sections = [
  {
    title: "1. Use of This Website",
    body:
      "CattleGuardForms.com provides product information, installation guidance, distributor resources, quote requests, order forms, and related business tools. By using this website, submitting a form, requesting a quote, creating an account, or placing an order, you agree to use the site only for lawful business or personal purposes.",
  },
  {
    title: "2. Product Information",
    body:
      "We make reasonable efforts to describe CowStop reusable cattle guard forms, pricing, installation information, and related materials accurately. Product images, installation examples, diagrams, and descriptions are provided for general information and may not represent every jobsite, installation condition, distributor process, freight method, or final concrete result.",
  },
  {
    title: "3. Pricing, Quotes, and Availability",
    body:
      "Prices, distributor pricing, volume discounts, freight estimates, taxes, and availability may change without notice until confirmed in writing or paid through an approved checkout process. Quote requests are not binding purchase orders until accepted and confirmed by Cattle Guard Forms or an authorized distributor.",
  },
  {
    title: "4. Orders, Payment, and Fulfillment",
    body:
      "Orders may require payment confirmation, shipping selection, bill of lading upload, manufacturer confirmation, and fulfillment review before shipment. Distributor orders may be subject to approved distributor account status, distributor pricing terms, freight arrangements, and internal review.",
  },
  {
    title: "5. Shipping, Freight, and Delivery",
    body:
      "Shipping and freight information may be provided through Cattle Guard Forms, a distributor, a carrier, Echo shipping integrations, or customer-arranged freight. Delivery dates, carrier rates, transit times, and manufacturer ship dates are estimates unless expressly confirmed by the applicable carrier or manufacturer.",
  },
  {
    title: "6. Installation and Site Conditions",
    body:
      "Installation instructions and videos are provided as general guidance only. Site conditions, soil, drainage, vehicle loads, local regulations, equipment, concrete quality, reinforcement, curing, and installation methods can affect performance. Customers are responsible for confirming suitability, compliance, and safe installation for their specific property and use case.",
  },
  {
    title: "7. User Submissions",
    body:
      "When you submit contact forms, quote requests, distributor information, shipping details, logos, BOL files, or other materials, you confirm that the information is accurate and that you have the right to provide it. We may use submitted information to process inquiries, manage orders, support distributors, communicate with manufacturers, and operate our CRM and marketing/admin systems.",
  },
  {
    title: "8. Accounts and Distributor Access",
    body:
      "Distributor portal access is limited to approved distributors and authorized users. Login credentials may not be shared outside the authorized distributor organization. Cattle Guard Forms may suspend or revoke access if an account is misused, inactive, inaccurate, or no longer approved.",
  },
  {
    title: "9. Website Availability",
    body:
      "We may update, modify, interrupt, or discontinue parts of the website, portal, forms, checkout flow, CRM, or integrations at any time. We are not responsible for temporary downtime, third-party service interruptions, carrier delays, payment processor issues, or external platform failures.",
  },
  {
    title: "10. Limitation of Liability",
    body:
      "To the fullest extent permitted by law, Cattle Guard Forms is not liable for indirect, incidental, consequential, special, or punitive damages arising from use of the website, installation guidance, product information, shipping estimates, third-party services, or customer-supplied installation decisions.",
  },
  {
    title: "11. Changes to These Terms",
    body:
      "We may update these Terms and Conditions from time to time. Continued use of the website after changes are posted means you accept the updated terms.",
  },
  {
    title: "12. Contact",
    body:
      "Questions about these terms may be sent through the contact form or by emailing support@cattleguardforms.com.",
  },
];

export default function TermsPage() {
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
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Terms and Conditions</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: April 26, 2026</p>
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
          These terms are a practical website/business draft and should be reviewed by a qualified attorney before being relied on as final legal terms.
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-8 text-neutral-700">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
