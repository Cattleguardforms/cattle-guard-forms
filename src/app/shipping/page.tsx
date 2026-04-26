import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const productSpecs = [
  ["CowStop mold length", "72 in / 6 ft"],
  ["CowStop mold width", "21.5 in"],
  ["CowStop mold height", "16 in"],
  ["Reusable mold weight", "80 lb"],
  ["Groove depth", "9 in"],
  ["Max per pallet", "6 CowStops"],
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
  "Customer selects quantity, then chooses Pickup or Ship to my address.",
  "If shipped, customer enters delivery address and selects freight needs: liftgate, residential, limited access, call before delivery, and optional insurance.",
  "System stores Good / Better / Best freight preference until Echo returns live rate options.",
  "Stripe checkout will eventually charge product total + selected freight + optional insurance together.",
  "Order confirmation tells the customer the order should ship within 48 to 72 hours after processing.",
  "When shipped, customer receives carrier, BOL, tracking/reference number, and delivery notes by email.",
];

const distributorFlow = [
  "Distributor chooses Pickup, Ship on Cattle Guard Forms freight account, or Ship on distributor freight account.",
  "Pallet sheet opens in front of the distributor so Echo dimensions and weights are visible while ordering.",
  "Our-account freight captures ship-to address and will use Good / Better / Best Echo quote selection.",
  "Distributor-account freight captures carrier, account number, pickup contact, requested pickup date, and BOL instructions.",
  "Manufacturer handoff is prepared with product quantity, pallet plan, fulfillment method, and customer/job details.",
  "Internal order status moves from draft to quote needed, BOL ready, sent to manufacturer, pickup ready, shipped, or completed.",
];

const accessorials = [
  ["Liftgate", "Customer/distributor needs truck liftgate at delivery."],
  ["Residential", "Delivery is not a commercial dock/business freight location."],
  ["Limited access", "Farm, ranch, jobsite, gated property, school, church, military base, storage, remote location, or similar."],
  ["Call before delivery", "Carrier should call the receiving contact before delivery."],
  ["Insurance", "Optional freight insurance/full value coverage selection."],
];

const statuses = [
  ["draft", "Order started but not ready for fulfillment."],
  ["awaiting_shipping_selection", "Customer/distributor still needs pickup or shipping choice."],
  ["echo_quote_needed", "Ship-to information exists and Echo rate quote is needed."],
  ["freight_selected", "Good / Better / Best or distributor freight method selected."],
  ["awaiting_payment", "Ready for Stripe payment once Stripe is wired."],
  ["paid", "Payment accepted; ready to send to manufacturer."],
  ["sent_to_manufacturer", "Order details, pallet plan, and freight instructions sent to Nice/manufacturer."],
  ["bol_ready", "BOL or distributor BOL instructions attached."],
  ["ready_for_pickup", "Pickup order is prepared at manufacturer."],
  ["shipped", "Carrier picked up shipment; tracking/BOL email should be sent."],
  ["completed", "Order delivered or picked up and closed."],
];

const manufacturerPayload = [
  "Order number and order channel: customer, distributor, or admin",
  "Customer/distributor name, email, phone, and job/customer reference",
  "Quantity ordered and pallet-by-pallet Echo dimensions/weights",
  "Fulfillment method: pickup, ship on Cattle Guard Forms account, or ship on distributor account",
  "Ship-to address or pickup instructions",
  "Accessorials: liftgate, residential, limited access, call before delivery, insurance",
  "Carrier, BOL, tracking, Echo quote/shipment ID, or distributor freight account instructions",
  "Expected processing window: 48 to 72 hours",
];

const emailTemplates = [
  {
    title: "Customer order received",
    body: "Your Cattle Guard Forms order has been received. Your order should ship within 48 to 72 hours after processing. You will receive another email once your order ships with BOL or tracking information.",
  },
  {
    title: "Pickup ready",
    body: "Your Cattle Guard Forms order is ready for pickup. Please bring your order number and follow the pickup instructions provided by our team.",
  },
  {
    title: "Shipment booked / BOL ready",
    body: "Your freight shipment has been booked. Carrier, BOL, tracking/reference number, and delivery details are included below.",
  },
  {
    title: "Manufacturer handoff",
    body: "New CowStop order ready for fulfillment. Includes quantity, pallet plan, customer/job details, shipping method, carrier/BOL information, and special delivery notes.",
  },
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
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Shipping workflow is ready for Echo and Stripe.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">Customer checkout, distributor freight choices, pallet dimensions, accessorials, manufacturer handoff, and email/status rules are defined here. Stripe can be wired after this foundation.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">Customer Checkout</Link>
            <Link href="/reseller" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Distributor Portal</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3 lg:grid-cols-6">
        {productSpecs.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-green-800">{label}</p>
            <p className="mt-2 text-lg font-black text-green-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-3">
        <Card title="Customer Shipping" eyebrow="Public checkout" items={customerFlow} cta="Open customer order page" href="/quote" />
        <Card title="Distributor Shipping" eyebrow="Reseller portal" items={distributorFlow} cta="Open distributor portal" href="/reseller" />
        <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Accessorials</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Shipping add-ons</h2>
          <div className="mt-6 space-y-3 text-sm">
            {accessorials.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-3">
                <p className="font-black text-green-900">{label}</p>
                <p className="mt-1 leading-6 text-neutral-700">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
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
              <thead className="bg-green-950 text-white"><tr><th className="px-5 py-4">Quantity</th><th className="px-5 py-4">Echo dimensions</th><th className="px-5 py-4">Echo weight</th><th className="px-5 py-4">Rule</th></tr></thead>
              <tbody className="divide-y divide-neutral-200">
                {palletRows.map((row) => (
                  <tr key={row.count}><td className="px-5 py-4 font-bold text-green-950">{row.label}</td><td className="px-5 py-4">{row.dimensions}</td><td className="px-5 py-4">{row.weight}</td><td className="px-5 py-4 text-neutral-600">One pallet</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 rounded-2xl bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-950 ring-1 ring-amber-200">For 7 or more CowStops, start another pallet and repeat the same 1–6 pallet table for the remaining quantity.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Status pipeline</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Order and shipping statuses</h2>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {statuses.map(([status, note], index) => (
              <div key={status} className="rounded-xl bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-800 text-xs font-black text-white">{index + 1}</span>
                  <span className="font-black text-neutral-900">{status}</span>
                </div>
                <p className="mt-2 leading-6 text-neutral-600">{note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Manufacturer handoff</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">What Nice/manufacturer receives</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-neutral-700">
            {manufacturerPayload.map((item) => (
              <li key={item} className="rounded-xl bg-neutral-50 p-3">{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 pb-16">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Email automation copy</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Customer, distributor, and manufacturer notices</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {emailTemplates.map((template) => (
              <div key={template.title} className="rounded-2xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <p className="font-black text-green-900">{template.title}</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">{template.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-green-950 p-6 text-white">
            <p className="text-xl font-black">Ready for Stripe next</p>
            <p className="mt-2 leading-7 text-green-50">The shipping model now defines product totals, shipping method, freight add-ons, pallet plan, and status rules. Stripe should charge product + selected freight + insurance after Echo/manual freight selection.</p>
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
        {items.map((item) => <li key={item} className="rounded-xl bg-neutral-50 p-3">{item}</li>)}
      </ul>
      <Link href={href} className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900">{cta}</Link>
    </article>
  );
}
