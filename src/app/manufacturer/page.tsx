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
    bolStatus: "Original BOL pending upload",
    signedBolStatus: "Signed BOL not returned",
    notificationStatus: "Not sent",
    bolDownloadLabel: "Download Original BOL",
    signedBolUploadLabel: "Upload Signed BOL",
  },
  {
    id: "CGF-MFG-DEMO-1002",
    distributor: "Demo Distributor Account",
    customer: "Pending customer assignment",
    quantity: "1 CowStop form",
    shipTo: "Shipping address appears here after order submission",
    status: "Awaiting ship date",
    bolStatus: "Original BOL available when uploaded",
    signedBolStatus: "Signed BOL not returned",
    notificationStatus: "Waiting on shipping block",
    bolDownloadLabel: "Download Original BOL",
    signedBolUploadLabel: "Upload Signed BOL",
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
    description: "When admin/distributor shipping documents are uploaded or emailed, the original BOL should be downloadable from the order row.",
    href: "#bol-downloads",
  },
  {
    title: "3. Return Signed BOL",
    description: "After fulfillment, upload the signed BOL in the portal or reply to orders@cattleguardforms.com with the signed BOL attached.",
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
                This portal is the manufacturer-facing fulfillment workspace for CowStop orders. Original BOLs should be downloadable here, signed BOLs should upload here, and email attachments should land in the same order file bucket.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm font-bold uppercase tracking-wide text-green-100">System inbox</p>
              <p className="mt-2 text-2xl font-black">orders@cattleguardforms.com</p>
              <p className="mt-3 text-sm leading-6 text-green-50">Manufacturer replies should keep the order ID in the subject or body. Signed BOL attachments from email should attach to the same order bucket as portal uploads.</p>
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
            <span className="col-span-2">Ship To</span>
            <span className="col-span-2">Original BOL</span>
            <span className="col-span-2">Actions</span>
          </div>
          {manufacturerOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-12 gap-3 border-t border-neutral-100 px-4 py-4 text-sm hover:bg-green-50/60">
              <div className="col-span-2">
                <p className="font-bold text-green-950">{order.id}</p>
                <p className="mt-1 text-xs text-neutral-500">{order.status}</p>
              </div>
              <div className="col-span-2">{order.distributor}</div>
              <div className="col-span-2">{order.quantity}</div>
              <div className="col-span-2 text-neutral-700">{order.shipTo}</div>
              <div className="col-span-2">{order.bolStatus}</div>
              <div className="col-span-2 flex flex-col gap-2">
                <a href="#bol-downloads" className="rounded bg-green-800 px-3 py-2 text-center text-xs font-bold text-white hover:bg-green-900">Download BOL</a>
                <a href={`#order-${order.id}`} className="rounded border border-neutral-300 px-3 py-2 text-center text-xs font-bold text-neutral-900 hover:border-green-800 hover:bg-green-50">View / Upload</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="bol-downloads" className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">BOL downloads</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Original BOLs should be downloadable on each order.</h2>
            <p className="mt-4 leading-7 text-neutral-700">
              When the distributor uses their own shipper account, the distributor uploads the original BOL before payment/fulfillment. That original BOL should attach to the order, travel with the manufacturer email, and be downloadable here if the manufacturer needs it again.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="font-bold text-neutral-950">Original BOL</p>
                <p className="mt-2 text-sm text-neutral-600">Uploaded by distributor/admin or attached through email.</p>
                <button className="mt-4 rounded bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900" type="button">Download Original BOL</button>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="font-bold text-neutral-950">Signed BOL</p>
                <p className="mt-2 text-sm text-neutral-600">Returned by manufacturer after shipment and stored back on the order.</p>
                <label className="mt-4 inline-flex cursor-pointer rounded border border-green-800 px-4 py-2 text-sm font-bold text-green-900 hover:bg-green-50">
                  Upload Signed BOL
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" />
                </label>
              </div>
            </div>
          </div>
          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <p className="text-sm font-bold uppercase tracking-[0.22em]">Backend requirement</p>
            <h3 className="mt-2 text-2xl font-black">Shared order-file bucket</h3>
            <p className="mt-4 text-sm leading-6">Needed: one order file attachment layer for original BOLs and signed BOLs, whether uploaded in portal or received as email attachments.</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
              <li>original_bol: distributor/admin upload or email attachment</li>
              <li>signed_bol: manufacturer portal upload or email reply attachment</li>
              <li>Visibility: admin, distributor, manufacturer</li>
              <li>Link files by order_id and preserve source_email_id when received by email</li>
            </ul>
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
                <div><dt className="font-bold text-neutral-950">Original BOL</dt><dd>{order.bolStatus}</dd></div>
                <div><dt className="font-bold text-neutral-950">Distributor Notice</dt><dd>{order.notificationStatus}</dd></div>
              </dl>
              <div className="mt-6 grid gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-700">
                <p className="font-bold text-neutral-950">Signed BOL return</p>
                <p>Upload the signed BOL here if it is not being sent back by email. If the manufacturer replies to orders@cattleguardforms.com with the signed BOL attached, it should land in this same order bucket.</p>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer rounded bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900">
                    Upload Signed BOL
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" />
                  </label>
                  <button type="button" className="rounded border border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-900 hover:border-green-800 hover:bg-white">Download Original BOL</button>
                </div>
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
            Distributor notification should only send when the order has a shipping block, carrier/PRO information, and signed BOL status. The notification should tell the distributor that the order has shipped and include tracking details, BOL download link, estimated delivery, manufacturer notes, and signed BOL when available.
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
