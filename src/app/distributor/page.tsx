"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const DISTRIBUTOR_UNIT_PRICE = 750;

const metrics = [
  { label: "New Requests", value: "0" },
  { label: "Pending Follow-Up", value: "0" },
  { label: "Paid Orders", value: "0" },
  { label: "Shipped", value: "0" },
];

const workflow = [
  "Review new CowStop quote and order requests",
  "Distributor pays online at the approved distributor rate",
  "Confirm shipping details before fulfillment",
  "Add carrier and tracking number when the order ships",
  "Customer receives tracking updates by email — no customer portal needed",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function DistributorPortalPage() {
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => quantity * DISTRIBUTOR_UNIT_PRICE, [quantity]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/distributor-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          email,
          company,
          contactName,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to start distributor checkout right now.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Unable to start distributor checkout right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/brand/cgf-logo.png"
              alt="Cattle Guard Forms"
              className="h-16 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">
              Home
            </Link>
            <Link href="/quote" className="hover:text-green-800">
              Shop
            </Link>
            <Link href="/installations" className="hover:text-green-800">
              Installations
            </Link>
            <Link href="/distributor" className="text-green-800">
              Distributor Portal
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
            Distributor order management
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-950">
                Distributor Portal
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                Approved distributors can place CowStop orders online, pay at the distributor rate, and manage customer fulfillment without requiring a customer login portal.
              </p>
            </div>
            <Link
              href="/quote"
              className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900"
            >
              View Retail Shop Page
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm font-medium text-neutral-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-neutral-950">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Distributor Online Payment</h2>
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 ring-1 ring-green-200">
                {currencyFormatter.format(DISTRIBUTOR_UNIT_PRICE)} / unit
              </span>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-neutral-700">
                  Contact name
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Name"
                    className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">
                  Company
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Distributor company"
                    className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Email for receipt
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="orders@example.com"
                  className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Quantity
                <select
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                >
                  {Array.from({ length: 50 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Distributor unit price</span>
                  <span>{currencyFormatter.format(DISTRIBUTOR_UNIT_PRICE)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-neutral-600">
                  <span>Quantity</span>
                  <span>{quantity}</span>
                </div>
                <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-xl font-bold text-neutral-950">
                  <span>Total</span>
                  <span>{currencyFormatter.format(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Opening checkout..." : "Pay Online"}
              </button>

              <p className="text-sm leading-6 text-neutral-500">
                Payments are processed through Stripe Checkout. Tracking updates will be sent by email after shipment, so a customer portal is not required.
              </p>
            </form>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Portal Workflow</h2>
            <ol className="mt-5 space-y-4">
              {workflow.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="leading-7 text-neutral-700">{item}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Incoming Requests</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
              Supabase order table wiring next
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Tracking</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-neutral-200">
                  <td className="px-4 py-6 text-neutral-500" colSpan={4}>
                    No live requests loaded yet. Next step is connecting this table to Supabase orders.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
