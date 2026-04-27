import Link from "next/link";

const navItems = [
  ["Portal Access", "/portals"],
  ["Admin Portal", "/admin"],
  ["Distributor Portal", "/distributor"],
  ["Marketing Portal", "/marketing"],
  ["Manufacturer Portal", "/manufacturer"],
];

const manufacturerOrders = [
  {
    id: "CGF-MFG-DEMO-1001",
    distributor: "Demo Distributor Account",
    customer: "Pending customer assignment",
    quantity: "2 CowStop forms",
    shipTo: "Shipping address appears here after order submission",
    status: "New order",
    bolStatus: "BOL pending upload",
    signedBolStatus: "Not returned",
    notificationStatus: "Not sent",
  },
  {
    id: "CGF-MFG-DEMO-1002",
    distributor: "Demo Distributor Account",
    customer: "Pending customer assignment",
    quantity: "1 CowStop form",
    shipTo: "Shipping address appears here after order submission",
    status: "Awaiting ship date",
    bolStatus: "BOL ready when uploaded",
    signedBolStatus: "Not returned",
    notificationStatus: "Waiting on shipping block",
  },
];

const workflowCards = [
  {
    title: "1. Review New Orders",
    description: "Open incoming manufacturer orders, confirm quantity, distributor, customer ship-to details, and whether the BOL is ready.",
    href: "#new-orders",
  },
  {
    title: "2. Download BOLs",
    description: "When admin/distributor shipping documents are uploaded, the BOL should appear in the order row for manufacturer download.",
    href: "#bol-downloads",
  },
  {
    title: "3. Return Signed BOL",
    description: "After fulfillment, upload or email the signed BOL back to orders@cattleguardforms.com so it attaches to the order record.",
    href: "#fulfilled-orders",
  },
  {
    title: "4. Send Shipping Block",
    description: "Carrier, PRO/tracking, ship date, delivery estimate, pallet count, and notes are required before distributor notification.",
    href: "#shipping-block",
  },
  {
    title: "5. Distributor Notification",
    description: "Once shipping details and signed BOL are present, the system can notify the distributor that the order shipped.",
    href: "#distributor-notification",
  },
];

const requiredFields = [
  "Order ID",
  "Order Status",
  "Ship Date",
  "Carrier",
  "Tracking Number / PRO Number",
  "Tracking Link, if available",
  "Estimated Delivery Date",
  "Number of Pallets",
  "Freight Class, if available",
  "BOL Number",
  "Signed BOL attachment or upload",
  "Manufacturer Notes",
];

export default function ManufacturerPortalPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-neutral-700 lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={href === "/manufacturer" ? "text-green-900 underline decoration-green-800 decoration-2 underline-offset-8" : "hover:text-green-800"}>{label}</Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Manufacturer fulfillment portal</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <h1 className="text-5xl font-black tracking-tight md:text-6xl">Review orders. Download BOLs. Return signed paperwork.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-green-50">
                This portal is the manufacturer-facing fulfillment workspace for CowStop orders. New orders, BOL downloads, signed BOL return, shipping details, and distributor notification status should all flow through this page.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm font-bold uppercase tracking-wide text-green-100">System inbox</p>
              <p className="mt-2 text-2xl font-black">orders@cattleguardforms.com</p>
              <p className="mt-3 text-sm leading-6 text-green-50">Manufacturer replies should keep the order ID in the subject or body so BOLs and shipping updates can be attached to the correct order.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-7xl px-6 relative z-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workflowCards.map((card) => (
            <a key={card.title} href={card.href} className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-neutral-200 hover:ring-green-800">
              <h2 className="text-lg font-black text-green-950">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{card.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="new-orders" className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">New orders</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Orders needing manufacturer review.</h2>
          </div>
          <Link href="/admin/orders" className="rounded-lg border border-neutral-300 px-5 py-3 text-sm font-bold hover:border-green-800 hover:bg-green-50">Open Admin Orders</Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="grid grid-cols-12 bg-neutral-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-600">
            <span className="col-span-2">Order</span>
            <span className="col-span-2">Distributor</span>
            <span className="col-span-2">Quantity</span>
            <span className="col-span-3">Ship To</span>
            <span className="col-span-2">BOL</span>
            <span className="col-span-1">Open</span>
          </div>
          {manufacturerOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-12 gap-3 border-t border-neutral-100 px-4 py-4 text-sm hover:bg-green-50/60">
              <div className="col-span-2">
                <p className="font-bold text-green-950">{order.id}</p>
                <p className="mt-1 text-xs text-neutral-500">{order.status}</p>
              </div>
              <div className="col-span-2">{order.distributor}</div>
              <div className="col-span-2">{order.quantity}</div>
              <div className="col-span-3 text-neutral-700">{order.shipTo}</div>
              <div className="col-span-2">{order.bolStatus}</div>
              <div className="col-span-1">
                <a href={`#order-${order.id}`} className="font-bold text-green-800 hover:text-green-950">View</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="bol-downloads" className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">BOL downloads</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">BOL files should appear on each order.</h2>
            <p className="mt-4 leading-7 text-neutral-700">
              When admin or distributor uploads a BOL, the file should attach to the order and become available here for the manufacturer to download. This v1 screen establishes the workflow area; the next backend pass should connect it to Supabase Storage or the final order-file table.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="font-bold text-neutral-950">Original BOL</p>
                <p className="mt-2 text-sm text-neutral-600">Uploaded before shipment and downloaded by manufacturer.</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="font-bold text-neutral-950">Signed BOL</p>
                <p className="mt-2 text-sm text-neutral-600">Returned by manufacturer after shipment and stored back on the order.</p>
              </div>
            </div>
          </div>
          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <p className="text-sm font-bold uppercase tracking-[0.22em]">Backend requirement</p>
            <h3 className="mt-2 text-2xl font-black">Order file attachment layer</h3>
            <p className="mt-4 text-sm leading-6">Needed fields: order_id, file_type, file_name, storage_path, uploaded_by_role, uploaded_at, source_email_id, and visibility flags for admin/distributor/manufacturer.</p>
          </aside>
        </div>
      </section>

      <section id="fulfilled-orders" className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Fulfilled orders</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Signed BOL return and completion status.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {manufacturerOrders.map((order) => (
            <article key={order.id} id={`order-${order.id}`} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-green-950">{order.id}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{order.distributor}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">{order.signedBolStatus}</span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                <div><dt className="font-bold text-neutral-950">Customer</dt><dd>{order.customer}</dd></div>
                <div><dt className="font-bold text-neutral-950">Quantity</dt><dd>{order.quantity}</dd></div>
                <div><dt className="font-bold text-neutral-950">BOL</dt><dd>{order.bolStatus}</dd></div>
                <div><dt className="font-bold text-neutral-950">Distributor Notice</dt><dd>{order.notificationStatus}</dd></div>
              </dl>
              <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-700">
                Signed BOL upload/drop zone placeholder. Next pass should accept PDF/image upload or attach inbound email attachment from orders@cattleguardforms.com.
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="shipping-block" className="bg-neutral-950 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-200">Required shipping block</p>
            <h2 className="mt-2 text-3xl font-black">Manufacturer reply format.</h2>
            <p className="mt-4 max-w-3xl leading-7 text-neutral-200">Manufacturers can copy this block into an email reply. Once inbound parsing is connected, the system should read this block, update the order, attach files, and trigger distributor notification.</p>
            <pre className="mt-6 overflow-x-auto rounded-2xl bg-black p-5 text-sm leading-6 text-white ring-1 ring-white/10">
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
BOL Number:
Signed BOL Attached: Yes / No
Manufacturer Notes:`}
            </pre>
          </div>
          <aside className="rounded-2xl bg-white p-6 text-neutral-950">
            <h3 className="text-2xl font-black">Required fields</h3>
            <ul className="mt-5 grid gap-2 text-sm leading-6 text-neutral-700">
              {requiredFields.map((field) => (
                <li key={field} className="rounded-lg border border-neutral-200 px-4 py-3">{field}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section id="distributor-notification" className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Distributor notification</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Notify distributor after shipment is complete.</h2>
          <p className="mt-4 max-w-4xl leading-7 text-neutral-700">
            Distributor notification should only send when the order has a shipping block, carrier/PRO information, and signed BOL status. The notification should tell the distributor that the order has shipped and include tracking details, BOL download link, estimated delivery, and any manufacturer notes.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["Shipping block", "Required"],
              ["Signed BOL", "Required"],
              ["Tracking / PRO", "Required"],
              ["Distributor email", "Send after complete"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-green-50 p-5 ring-1 ring-green-200">
                <p className="text-sm font-bold text-green-950">{label}</p>
                <p className="mt-2 text-sm text-green-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
