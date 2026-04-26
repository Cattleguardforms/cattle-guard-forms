import Link from "next/link";

const distributors = [
  { name: "Farm and Ranch Experts", contact: "Setup pending", email: "orders@farmandranchexperts.com", phone: "Pending", status: "Active", orders: 0, active: 0, revenue: "$0" },
  { name: "Barn World", contact: "Setup pending", email: "orders@barnworld.com", phone: "Pending", status: "Active", orders: 0, active: 0, revenue: "$0" },
];

export default function AdminDistributorsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Distributors</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Manage Distributor Accounts</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">View each distributor, contact person, email, status, order count, active orders, and revenue. Supabase will make this live next.</p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-3">Distributor</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Revenue</th></tr></thead>
            <tbody>{distributors.map((row) => <tr key={row.name} className="border-t border-neutral-200"><td className="px-4 py-4 font-medium">{row.name}</td><td className="px-4 py-4">{row.contact}</td><td className="px-4 py-4">{row.email}</td><td className="px-4 py-4">{row.phone}</td><td className="px-4 py-4 text-green-800">{row.status}</td><td className="px-4 py-4">{row.orders}</td><td className="px-4 py-4">{row.active}</td><td className="px-4 py-4">{row.revenue}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
