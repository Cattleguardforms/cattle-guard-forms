"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type PricingPayload = {
  ok?: boolean;
  error?: string;
  price_per_unit?: number;
  default_price?: number;
};

export default function AdminPricingPage() {
  const [price, setPrice] = useState("1499");
  const [defaultPrice, setDefaultPrice] = useState(1499);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function loadPricing() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/customer-pricing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as PricingPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load customer pricing.");
      setPrice(String(payload.price_per_unit ?? 1499));
      setDefaultPrice(payload.default_price ?? 1499);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customer pricing.");
    } finally {
      setLoading(false);
    }
  }

  async function savePricing() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const nextPrice = Number(price);
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) throw new Error("Enter a valid price like 1499 or 1200.");
      const token = await getAccessToken();
      const response = await fetch("/api/admin/customer-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price_per_unit: nextPrice }),
      });
      const payload = (await response.json()) as PricingPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to save customer pricing.");
      setPrice(String(payload.price_per_unit ?? nextPrice));
      setNotice(`Customer-facing unit price saved at $${nextPrice.toFixed(2)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save customer pricing.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  useEffect(() => {
    void loadPricing();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link>
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <button onClick={() => void handleSignOut()} className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Sign Out</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Pricing</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Customer-Facing Price</h1>
        <p className="mt-4 leading-8 text-neutral-700">
          This controls the public customer checkout price per CowStop form. Distributor prices are managed separately under Distributor Accounts.
        </p>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-bold uppercase tracking-wide text-neutral-600" htmlFor="customer-price">Customer unit price</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2">
              <span className="font-bold text-neutral-600">$</span>
              <input
                id="customer-price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                className="ml-2 w-40 border-0 text-2xl font-bold outline-none"
                disabled={loading || saving}
              />
            </div>
            <button
              onClick={() => void savePricing()}
              disabled={loading || saving}
              className="rounded-lg bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Customer Price"}
            </button>
            <button
              onClick={() => setPrice(String(defaultPrice))}
              disabled={loading || saving}
              className="rounded-lg border border-neutral-300 px-5 py-3 font-bold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
            >
              Reset to ${defaultPrice}
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            Future customer checkouts will use this price. Existing orders and distributor checkouts are not changed.
          </p>
        </div>
      </section>
    </main>
  );
}
