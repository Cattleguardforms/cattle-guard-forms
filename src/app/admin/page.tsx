"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabaseAuth = Boolean(supabaseUrl && supabaseKey);

const adminMetrics = [
  ["Total Distributors", "2", "Approved distributor accounts", "/admin/distributors"],
  ["Active Orders", "0", "Open retail and distributor orders", "/admin/orders"],
  ["Abandoned Checkouts", "0", "Customers who started but did not finish", "/admin/abandoned-checkouts"],
  ["Visits Today", "0", "Analytics wiring next", "/admin/analytics"],
  ["Visits This Month", "0", "Monthly site traffic", "/admin/analytics"],
  ["Pending Ship Dates", "0", "Manufacturer follow-up needed", "/admin/orders"],
  ["BOL Uploads Pending", "0", "Ship-on-own orders missing BOL", "/admin/orders"],
  ["New CRM Leads", "0", "Contact and quote form submissions", "/admin/crm-activity"],
];

const distributorRows = [
  { name: "Farm and Ranch Experts", contact: "Setup pending", email: "orders@farmandranchexperts.com", status: "Active", totalOrders: 0, activeOrders: 0, revenue: "$0", lastOrder: "No orders yet" },
  { name: "Barn World", contact: "Setup pending", email: "orders@barnworld.com", status: "Active", totalOrders: 0, activeOrders: 0, revenue: "$0", lastOrder: "No orders yet" },
];

const adminModules = [
  ["Manage Distributor Accounts", "Open each distributor account, contact person, logo, status, and order history.", "/admin/distributors"],
  ["Orders", "Open all active retail and distributor orders, CRM customer records, fulfillment, and tracking.", "/admin/orders"],
  ["Abandoned Checkouts", "View abandoned carts/checkouts and follow up by email.", "/admin/abandoned-checkouts"],
  ["Site Analytics", "View visits today, monthly visits, sources, and conversion activity.", "/admin/analytics"],
  ["CRM Activity", "View contacts, quote requests, follow-ups, and account history.", "/admin/crm-activity"],
  ["Settings", "Manage admin users, roles, email settings, integrations, and portal rules.", "/admin/settings"],
];

function AdminHeader() {
  return (
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
  );
}

export default function AdminPortalPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (hasSupabaseAuth && supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        // TODO: Enforce admin role server-side before production.
        setSignedIn(true);
        return;
      }

      if (!email.includes("@")) {
        setError("Enter an admin email address.");
        return;
      }
      // TODO: Remove placeholder admin gate after Supabase admin roles are live.
      setSignedIn(true);
    } finally {
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <AdminHeader />
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Protected admin access</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Portal Login</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
              The Admin Portal is restricted to approved administrators. It controls distributor reporting, orders, abandoned checkout recovery, analytics, CRM activity, and business settings.
            </p>
            <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
              {hasSupabaseAuth ? "Supabase auth is available. Admin role enforcement still needs server-side wiring." : "Supabase auth is not configured here. This setup login is temporary and not production security."}
            </div>
          </div>

          <form onSubmit={handleLogin} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Admin Sign In</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Sign in to access the business command center.</p>
            {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Admin email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="admin@cattleguardforms.com" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Password
                <input required={hasSupabaseAuth} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Password" />
              </label>
              <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
                {loading ? "Signing in..." : "Log In to Admin Portal"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <AdminHeader />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Business command center</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Portal</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                View distributor accounts, active orders, abandoned checkouts, site analytics, CRM activity, and settings. Use the Marketing Portal for campaigns, social media, and CRM workspace tasks.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/marketing" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Go to Marketing Portal</Link>
              <button onClick={() => setSignedIn(false)} className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">Sign Out</button>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminMetrics.map(([label, value, note, href]) => (
            <Link key={label} href={href} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Distributor Summary</h2>
              <Link href="/admin/distributors" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Manage Accounts</Link>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-3">Distributor</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Revenue</th></tr></thead>
                <tbody>{distributorRows.map((row) => <tr key={row.name} className="border-t border-neutral-200"><td className="px-4 py-4 font-medium">{row.name}</td><td className="px-4 py-4 text-neutral-600">{row.contact}</td><td className="px-4 py-4 text-neutral-600">{row.email}</td><td className="px-4 py-4">{row.totalOrders}</td><td className="px-4 py-4">{row.activeOrders}</td><td className="px-4 py-4">{row.revenue}</td></tr>)}</tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Admin Modules</h2>
            <div className="mt-5 grid gap-3">
              {adminModules.map(([title, description, href]) => (
                <Link key={title} href={href} className="rounded-xl border border-neutral-200 p-4 hover:border-green-800 hover:bg-green-50">
                  <h3 className="font-semibold text-neutral-950">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
