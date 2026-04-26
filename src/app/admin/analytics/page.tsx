import Link from "next/link";

const trafficCards = [
  ["Visits Today", "0", "Daily traffic will appear here."],
  ["Visits This Month", "0", "Monthly traffic will appear here."],
  ["Quote Starts", "0", "Customers who started the shop form."],
  ["Quote Submissions", "0", "Completed quote/contact submissions."],
  ["Checkout Starts", "0", "Customers who started checkout."],
  ["Completed Orders", "0", "Paid orders after Stripe is connected."],
];

const sources = [
  ["Direct", "0", "0%"],
  ["Organic Search", "0", "0%"],
  ["Social", "0", "0%"],
  ["Distributor Referral", "0", "0%"],
  ["Paid Campaign", "0", "0%"],
];

export default function AdminAnalyticsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Analytics</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Site Analytics</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
          This page will track visits, traffic sources, quote starts, quote submissions, distributor logins, checkout starts, abandoned checkouts, and completed orders.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trafficCards.map(([label, value, note]) => (
            <article key={label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Traffic Sources</h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-3">Source</th><th className="px-4 py-3">Visits</th><th className="px-4 py-3">Conversion Rate</th></tr></thead>
              <tbody>{sources.map(([source, visits, conversion]) => <tr key={source} className="border-t border-neutral-200"><td className="px-4 py-4 font-medium">{source}</td><td className="px-4 py-4">{visits}</td><td className="px-4 py-4">{conversion}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
