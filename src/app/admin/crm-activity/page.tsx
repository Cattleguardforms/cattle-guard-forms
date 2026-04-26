import Link from "next/link";

const activity = [
  {
    type: "No CRM activity yet",
    person: "Contact/company will appear here",
    source: "Contact, quote, order, distributor, or checkout",
    status: "Awaiting Supabase data",
    lastActivity: "Pending",
  },
];

export default function AdminCrmActivityPage() {
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
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / CRM Activity</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">CRM Activity</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
          This page will show new contacts, quote requests, contact form submissions, order activity, abandoned checkout activity, distributor updates, notes, and follow-up tasks.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">New Contacts</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Quote Requests</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Follow-Ups</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Notes</p><p className="mt-2 text-3xl font-bold">0</p></div>
        </section>

        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Person / Company</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last Activity</th></tr>
            </thead>
            <tbody>{activity.map((row) => <tr key={row.type} className="border-t border-neutral-200"><td className="px-4 py-4 font-medium">{row.type}</td><td className="px-4 py-4">{row.person}</td><td className="px-4 py-4">{row.source}</td><td className="px-4 py-4">{row.status}</td><td className="px-4 py-4 text-neutral-600">{row.lastActivity}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
