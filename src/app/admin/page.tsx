import Link from "next/link";

const cards = [
  ["Leads", "0", "Incoming shop requests and quote leads."],
  ["Distributor Orders", "0", "Distributor order activity and status."],
  ["Fulfillment", "0", "Manufacturer, ship-date, and tracking follow-up."],
  ["Content Tasks", "0", "Homepage, shop, install, and campaign updates."],
];

const modules = [
  "Lead Inbox",
  "Distributor Accounts",
  "Order Pipeline",
  "Uploaded Files",
  "Email Activity",
  "Marketing Content",
];

const pipeline = [
  "New lead received",
  "Reviewed by admin",
  "Customer or distributor contacted",
  "Payment confirmed",
  "Sent to manufacturer",
  "Ship date received",
  "Tracking sent",
  "Completed",
];

export default function MarketingAdminPortalPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/admin" className="text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Reusable marketing/admin slice</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Marketing Portal</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
            A clean foundation for managing leads, distributor activity, fulfillment follow-up, files, email activity, and marketing content. This page is intentionally built as a reusable slice so it can be adapted for future sites instead of being tied only to Cattle Guard Forms.
          </p>
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
            Admin authentication and live Supabase data are not connected yet. Tomorrow this should be wired to real tables, roles, and storage.
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, note]) => (
            <article key={label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Portal Modules</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {modules.map((module) => (
                <div key={module} className="rounded-xl border border-neutral-200 p-5">
                  <h3 className="font-semibold text-neutral-950">{module}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">Supabase wiring next.</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Order Pipeline</h2>
            <ol className="mt-5 space-y-4">
              {pipeline.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">{index + 1}</span>
                  <span className="leading-7 text-neutral-700">{item}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Reusable Boundary</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Keep the core portal generic: leads, contacts, orders, files, notes, content blocks, and email activity. Keep Cattle Guard Forms-specific logic separate: CowStop pricing, Echo freight, BOL uploads, distributor logos, and manufacturer fulfillment.
          </p>
        </section>
      </section>
    </main>
  );
}
