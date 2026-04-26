import Link from "next/link";

const orders = [
  {
    id: "No active orders yet",
    customer: "Customer/distributor will appear here",
    email: "Pending",
    type: "Retail or Distributor",
    quantity: 0,
    status: "Awaiting Supabase data",
    payment: "Pending",
    fulfillment: "Pending",
  },
];

export default function AdminOrdersPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Orders</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Active Orders</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
          This page will show every retail order and distributor order, tied back to the CRM contact/company, payment status, fulfillment status, BOL/shipping information, manufacturer response, and tracking.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Active Orders</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pending Manufacturer</p><p className="mt-2 text-3xl font-bold">0</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Ready to Ship</p><p className="mt-2 text-3xl font-bold">0</p></div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer / Distributor</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-200">
                  <td className="px-4 py-4 font-medium">{order.id}</td>
                  <td className="px-4 py-4">{order.customer}</td>
                  <td className="px-4 py-4 text-neutral-600">{order.email}</td>
                  <td className="px-4 py-4">{order.type}</td>
                  <td className="px-4 py-4">{order.quantity}</td>
                  <td className="px-4 py-4">{order.payment}</td>
                  <td className="px-4 py-4">{order.fulfillment}</td>
                  <td className="px-4 py-4 text-neutral-600">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
