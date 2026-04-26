import Link from "next/link";

const adminMetrics = [
  ["Total Distributors", "2", "Approved distributor accounts"],
  ["Active Orders", "0", "Open retail and distributor orders"],
  ["Abandoned Checkouts", "0", "Customers who started but did not finish"],
  ["Visits Today", "0", "Analytics wiring next"],
  ["Visits This Month", "0", "Monthly site traffic"],
  ["Pending Ship Dates", "0", "Manufacturer follow-up needed"],
  ["BOL Uploads Pending", "0", "Ship-on-own orders missing BOL"],
  ["New CRM Leads", "0", "Contact and quote form submissions"],
];

const distributorRows = [
  {
    name: "Farm and Ranch Experts",
    status: "Active",
    totalOrders: 0,
    activeOrders: 0,
    revenue: "$0",
    lastOrder: "No orders yet",
  },
  {
    name: "Barn World",
    status: "Active",
    totalOrders: 0,
    activeOrders: 0,
    revenue: "$0",
    lastOrder: "No orders yet",
  },
];

const adminModules = [
  ["Distributors", "Manage distributor accounts, logos, orders, and status."],
  ["Orders", "Review retail orders, distributor orders, fulfillment, and tracking."],
  ["Abandoned Checkouts", "Recover started checkouts and email customers who did not complete."],
  ["Site Analytics", "Track visits today, visits this month, source traffic, and conversion activity."],
  ["CRM Activity", "See new contacts, quote requests, follow-ups, and account history."],
  ["Settings", "Manage admin access, business email settings, integrations, and portal rules."],
];

const abandonedCheckoutRows = [
  ["No abandoned checkouts yet", "Customer email will appear here", "$0", "Awaiting Stripe/cart tracking"],
];

export default function AdminPortalPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="text-green-800">Admin Portal</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <Link href="/distributor" className="hover:text-green-800">Distributor Portal</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Business command center</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Portal</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                This is the owner dashboard for Cattle Guard Forms. It shows distributor activity, active orders, abandoned checkouts, fulfillment status, CRM activity, and site traffic. The Marketing Portal stays separate as the CRM, campaign, content, and social media workspace.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/marketing" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
                Go to Marketing Portal
              </Link>
              <Link href="/distributor" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">
                View Distributor Portal
              </Link>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
            Admin login, real analytics, abandoned checkout tracking, distributor role enforcement, and live Supabase records are still placeholders until Supabase and production integrations are connected.
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminMetrics.map(([label, value, note]) => (
            <article key={label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Distributor Summary</h2>
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 ring-1 ring-green-200">2 distributors</span>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Distributor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Total Orders</th>
                    <th className="px-4 py-3 font-semibold">Active</th>
                    <th className="px-4 py-3 font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {distributorRows.map((row) => (
                    <tr key={row.name} className="border-t border-neutral-200">
                      <td className="px-4 py-4 font-medium text-neutral-950">{row.name}</td>
                      <td className="px-4 py-4 text-green-800">{row.status}</td>
                      <td className="px-4 py-4">{row.totalOrders}</td>
                      <td className="px-4 py-4">{row.activeOrders}</td>
                      <td className="px-4 py-4">{row.revenue}</td>
                      <td className="px-4 py-4 text-neutral-600">{row.lastOrder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Admin Modules</h2>
            <div className="mt-5 grid gap-3">
              {adminModules.map(([title, description]) => (
                <article key={title} className="rounded-xl border border-neutral-200 p-4">
                  <h3 className="font-semibold text-neutral-950">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Abandoned Checkouts</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              When Stripe/cart tracking is connected, customers who start checkout but do not finish will appear here for follow-up.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Value</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {abandonedCheckoutRows.map(([customer, email, value, status]) => (
                    <tr key={customer} className="border-t border-neutral-200">
                      <td className="px-4 py-4">{customer}</td>
                      <td className="px-4 py-4 text-neutral-600">{email}</td>
                      <td className="px-4 py-4">{value}</td>
                      <td className="px-4 py-4 text-neutral-600">{status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Traffic & Conversion</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Analytics should show visits, sources, quote starts, quote submissions, distributor logins, checkout starts, and completed orders.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <p className="text-sm text-neutral-500">Today</p>
                <p className="mt-2 text-3xl font-bold">0 visits</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <p className="text-sm text-neutral-500">This Month</p>
                <p className="mt-2 text-3xl font-bold">0 visits</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <p className="text-sm text-neutral-500">Quote Starts</p>
                <p className="mt-2 text-3xl font-bold">0</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <p className="text-sm text-neutral-500">Completed Orders</p>
                <p className="mt-2 text-3xl font-bold">0</p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
