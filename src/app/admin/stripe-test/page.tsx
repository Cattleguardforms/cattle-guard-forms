import Link from "next/link";

export default function AdminStripeTestPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/admin" className="text-sm font-semibold text-green-800 hover:text-green-900">Back to Admin</Link>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Disabled production tool</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-amber-950">Sandbox checkout is disabled</h1>
          <p className="mt-4 leading-7 text-amber-950">
            This test checkout page has been disabled now that Cattle Guard Forms is operating in live mode. Use the normal customer and distributor checkout flows for production orders.
          </p>
        </div>
      </section>
    </main>
  );
}
