import Link from "next/link";

const workflowSteps = [
  {
    title: "1. Review new order emails",
    description: "Manufacturer order emails are sent from orders@cattleguardforms.com and include the order ID, distributor, quantity, ship-to details, and shipping method.",
  },
  {
    title: "2. Fulfill the order",
    description: "Prepare the CowStop form order using the order details in the manufacturer email.",
  },
  {
    title: "3. Reply with the shipping block",
    description: "When the order ships, copy the SHIPPING UPDATE block from the email, fill in carrier/tracking details, and reply back to orders@cattleguardforms.com.",
  },
  {
    title: "4. Distributor notification",
    description: "The system will use the structured reply to update the order workflow and send shipment details to the distributor after parsing/review is enabled.",
  },
];

const requiredFields = [
  "Order ID",
  "Order Status",
  "Ship Date",
  "Carrier",
  "Tracking Number / PRO Number",
  "Tracking Link",
  "Estimated Delivery Date",
  "Number of Pallets",
  "Freight Class, if available",
  "BOL Number, if available",
  "Manufacturer Notes",
];

export default function ManufacturerPortalPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/portals" className="hover:text-green-800">Portal Access</Link>
            <Link href="/admin" className="hover:text-green-800">Admin Portal</Link>
            <Link href="/distributor" className="hover:text-green-800">Distributor Portal</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <Link href="/manufacturer" className="text-green-800">Manufacturer Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Manufacturer fulfillment workflow</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Manufacturer Portal</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-neutral-700">
            This portal documents the manufacturer fulfillment process for CowStop distributor orders. For now, manufacturers receive structured order emails and reply with a copy/paste shipping update block. Later, this page can become a protected live fulfillment dashboard.
          </p>
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
            Current system inbox: orders@cattleguardforms.com. Manufacturer replies should keep the order ID in the subject or body so shipment updates can be matched to the correct order.
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step) => (
            <div key={step.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold text-green-950">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{step.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Shipping update reply format</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Manufacturers should copy this block into their email reply when an order ships. This keeps replies consistent and prepares the system for automated parsing.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-xl bg-neutral-950 p-5 text-sm leading-6 text-white">
{`SHIPPING UPDATE - COPY/PASTE BELOW

Order ID:
Order Status: Shipped
Ship Date:
Carrier:
Tracking Number / PRO Number:
Tracking Link:
Estimated Delivery Date:
Number of Pallets:
Freight Class, if available:
BOL Number, if available:
Manufacturer Notes:`}
            </pre>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Required fields</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-neutral-700">
              {requiredFields.map((field) => (
                <li key={field} className="rounded-lg border border-neutral-200 px-4 py-3">{field}</li>
              ))}
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}
