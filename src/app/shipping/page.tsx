import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const palletRows = [
  { count: 1, label: "1 CowStop", dimensions: "72 x 48 x 20 in", weight: "105 lb" },
  { count: 2, label: "2 CowStops", dimensions: "72 x 48 x 20 in", weight: "190 lb" },
  { count: 3, label: "3 CowStops", dimensions: "72 x 48 x 36 in", weight: "270 lb" },
  { count: 4, label: "4 CowStops", dimensions: "72 x 48 x 36 in", weight: "355 lb" },
  { count: 5, label: "5 CowStops", dimensions: "72 x 48 x 52 in", weight: "440 lb" },
  { count: 6, label: "6 CowStops", dimensions: "72 x 48 x 52 in", weight: "525 lb" },
];

const customerFlow = [
  "Customer selects pickup or ship-to-address during checkout.",
  "If shipped, customer enters delivery address and accessorials: liftgate, residential, limited access, call before delivery, and optional insurance.",
  "System stores Good / Better / Best freight preference for Echo quoting.",
  "Order confirmation tells the customer the order should ship within 48 to 72 hours after processing.",
  "When shipped, customer receives BOL or tracking information by email.",
];

const distributorFlow = [
  "Distributor chooses pickup, ship on Cattle Guard Forms account, or ship on distributor freight account.",
  "Pallet dimensions and weights remain visible so Echo entries match the 1 to 6 CowStop pallet rules.",
  "Distributor-account freight captures carrier, account number, pickup contact, requested date, and BOL instructions.",
  "Manufacturer copy is prepared with product quantity, pallet plan, fulfillment method, and customer/job details.",
  "Internal order status moves from draft to Echo quote, awaiting BOL, sent to manufacturer, shipped, or pickup ready.",
];

export default function ShippingPortalPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-green-800">{label}</Link>
            ))}
          </nav>
          <Link href="/reseller" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Distributor Portal</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.25),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Shipping operations</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Customer, distributor, Echo, and manufacturer shipping control center.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">This page defines the live shipping workflow used by the customer checkout and distributor portal while the Echo API integration is being wired in.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-3">
        <Card title="Customer Shipping" eyebrow="Public checkout" items={customerFlow} cta="Open customer order page" href="/quote" />
        <Card title="Distributor Shipping" eyebrow="Reseller portal" items={distributorFlow} cta="Open distributor portal" href="/reseller" />
        <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Status pipeline</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Shipping statuses</h2>
          <div className="mt-6 space-y-3 text-sm">
            {[
              "Order received",
              "Echo quote needed",
              "Freight selected",
              "BOL ready",
              "Sent to manufacturer",
              "Pickup ready",
              "Shipped",
              "Tracking/BOL emailed",
            ].map((status, index) => (
              <div key={status} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-800 text-xs font-black text-white">{index + 1}</span>
                <span className="font-semibold text-neutral-800">{status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Echo freight sheet</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Pallet dimensions and weights</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 ring-1 ring-amber-200">Maximum 6 CowStops per pallet</span>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-green-950 text-white">
                <tr>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Echo dimensions</th>
                  <th className="px-5 py-4">Echo weight</th>
                  <th className="px-5 py-4">Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {palletRows.map((row) => (
                  <tr key={row.count}>
                    <td className="px-5 py-4 font-bold text-green-950">{row.label}</td>
                    <td className="px-5 py-4">{row.dimensions}</td>
                    <td className="px-5 py-4">{row.weight}</td>
                    <td className="px-5 py-4 text-neutral-600">One pallet</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Info label="Manufacturer handoff" value="Send order, quantity, pallet plan, pickup/ship method, BOL or freight instructions." />
            <Info label="Customer email" value="Confirm order received, 48–72 hour ship expectation, then send tracking or BOL after shipment." />
            <Info label="Echo integration" value="Future API should return Good / Better / Best options and pass BOL data back to the order." />
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ eyebrow, title, items, cta, href }: { eyebrow: string; title: string; items: string[]; cta: string; href: string }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
      <ul className="mt-6 space-y-3 text-sm leading-6 text-neutral-700">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-neutral-50 p-3">{item}</li>
        ))}
      </ul>
      <Link href={href} className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900">{cta}</Link>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
      <p className="font-black text-green-900">{label}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{value}</p>
    </div>
  );
}
