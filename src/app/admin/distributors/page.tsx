"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type DistributorRow = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  status: string;
  price_per_unit: number;
  orders: number;
  active: number;
  revenue: string;
};

type DistributorPayload = {
  ok?: boolean;
  error?: string;
  summary?: {
    distributors: number;
    active: number;
    totalOrders: number;
    activeOrders: number;
  };
  distributors?: DistributorRow[];
};

export default function AdminDistributorsPage() {
  const [distributors, setDistributors] = useState<DistributorRow[]>([]);
  const [summary, setSummary] = useState<DistributorPayload["summary"]>({ distributors: 0, active: 0, totalOrders: 0, activeOrders: 0 });
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function getAccessToken() {
    if (!supabase) throw new Error("Admin auth is not available right now.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return token;
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  async function loadDistributors() {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/distributors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as DistributorPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load distributors.");
      setDistributors(payload.distributors ?? []);
      setSummary(payload.summary ?? { distributors: 0, active: 0, totalOrders: 0, activeOrders: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load distributors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkSessionAndLoad() {
      if (!supabase) {
        setError("Admin authentication is not available right now.");
        setSessionChecked(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        setHasSession(false);
        setSessionChecked(true);
        setLoading(false);
        window.location.href = "/admin";
        return;
      }

      setHasSession(true);
      setSessionChecked(true);
      await loadDistributors();
    }

    void checkSessionAndLoad();
  }, [supabase]);

  if (!sessionChecked || !hasSession) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Checking admin session</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Redirecting to admin login...</h1>
          {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <button onClick={() => void handleSignOut()} className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Sign Out</button>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Distributors</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Manage Distributor Accounts</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">Live distributor profile, contact, order count, active order, price, and revenue data from Supabase.</p>
          </div>
          <button onClick={() => void loadDistributors()} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
            Refresh Distributors
          </button>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Distributors</p><p className="mt-2 text-3xl font-bold">{summary?.distributors ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Active</p><p className="mt-2 text-3xl font-bold">{summary?.active ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Total Orders</p><p className="mt-2 text-3xl font-bold">{summary?.totalOrders ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Active Orders</p><p className="mt-2 text-3xl font-bold">{summary?.activeOrders ?? 0}</p></div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-3">Distributor</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Unit Price</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Revenue</th></tr></thead>
            <tbody>
              {loading ? <tr className="border-t border-neutral-200"><td colSpan={9} className="px-4 py-8 text-center text-neutral-600">Loading distributors...</td></tr> : null}
              {!loading && distributors.length === 0 ? <tr className="border-t border-neutral-200"><td colSpan={9} className="px-4 py-8 text-center text-neutral-600">No distributor profiles found in Supabase.</td></tr> : null}
              {!loading && distributors.map((row) => <tr key={row.id || row.email || row.name} className="border-t border-neutral-200"><td className="px-4 py-4 font-medium">{row.name}</td><td className="px-4 py-4">{row.contact}</td><td className="px-4 py-4">{row.email || "Not set"}</td><td className="px-4 py-4">{row.phone}</td><td className="px-4 py-4 text-green-800">{row.status}</td><td className="px-4 py-4">${row.price_per_unit || 0}</td><td className="px-4 py-4">{row.orders}</td><td className="px-4 py-4">{row.active}</td><td className="px-4 py-4">{row.revenue}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
