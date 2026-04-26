import Link from "next/link";

const abandonedCheckouts = [
  {
    customer: "No abandoned checkouts yet",
    email: "Customer email will appear here",
    value: "$0",
    product: "CowStop Reusable Form",
    stage: "Awaiting Stripe/cart tracking",
    lastActivity: "Pending",
  },
];

export default function AdminAbandonedCheckoutsPage() {
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
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Abandoned Checkouts</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Abandoned Checkouts</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
          This page will show customers who started checkout or cart activity but did not complete payment, so the team can email them and recover the order.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Abandoned Today</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Potential Revenue</p><p className="mt-2 text-3xl font-bold">$0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Recovery Emails</p><p className="mt-2 text-3xl font-bold">0</p></div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {abandonedCheckouts.map((row) => (
                <tr key={row.customer} className="border-t border-neutral-200">
                  <td className="px-4 py-4 font-medium">{row.customer}</td>
                  <td className="px-4 py-4 text-neutral-600">{row.email}</td>
                  <td className="px-4 py-4">{row.product}</td>
                  <td className="px-4 py-4">{row.value}</td>
                  <td className="px-4 py-4">{row.stage}</td>
                  <td className="px-4 py-4 text-neutral-600">{row.lastActivity}</td>
                  <td className="px-4 py-4"><button type="button" className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold">Email later</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
