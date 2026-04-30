"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type ProfileResponse = { ok?: boolean; error?: string; profile?: { email: string; companyName?: string; pricePerUnit?: number } };

type DistributorOrder = { id: string; shortId: string; quantityLabel: string; total: number; paymentStatus: string; status: string; shipTo: string };
type OrdersPayload = { ok?: boolean; error?: string; orders?: DistributorOrder[] };

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function statusLabel(value?: string) {
  if (!value) return "Pending";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DistributorHomePage() {
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState(750);
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function getToken() {
    if (!supabase) throw new Error("Distributor auth is not available.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Distributor sign-in is required.");
    return token;
  }

  async function loadOrders(token?: string) {
    const activeToken = token ?? (await getToken());
    const response = await fetch("/api/distributor/orders", { headers: { Authorization: `Bearer ${activeToken}` } });
    const payload = (await response.json()) as OrdersPayload;
    if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load distributor orders.");
    setOrders(payload.orders ?? []);
  }

  async function verify() {
    if (!supabase) {
      setError("Distributor auth is not available.");
      setReady(true);
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSignedIn(false);
        setReady(true);
        return;
      }

      const response = await fetch("/api/distributor/profile", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as ProfileResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Approved distributor access is required.");

      setSignedIn(true);
      setEmail(payload.profile?.email ?? "");
      setCompanyName(payload.profile?.companyName ?? "Approved Distributor");
      setPricePerUnit(payload.profile?.pricePerUnit ?? 750);
      await loadOrders(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approved distributor access is required.");
      await supabase.auth.signOut();
      setSignedIn(false);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void verify();
  }, [supabase]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!supabase) throw new Error("Distributor sign-in is not available.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (signInError) throw new Error("Invalid distributor credentials.");
      setPassword("");
      await verify();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setSignedIn(false);
    setCompanyName("");
    setOrders([]);
    if (supabase) await supabase.auth.signOut();
  }

  if (!ready) return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">Loading distributor portal...</main>;

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <Link href="/distributor" className="text-sm font-semibold text-green-800">Back to distributor access</Link>
          <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p>
          <h1 className="mt-2 text-3xl font-black">Distributor Sign In</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-700">Sign in to access your distributor home, shop, order history, documents, and support.</p>
          {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
          <form onSubmit={signIn} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
            <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? "Signing in..." : "Sign In"}</button>
          </form>
        </section>
      </main>
    );
  }

  const openOrders = orders.filter((order) => !["delivered", "archived", "cancelled"].includes((order.status || "").toLowerCase()));
  const pastOrders = orders.filter((order) => ["delivered", "archived", "cancelled"].includes((order.status || "").toLowerCase()));

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href="/distributor" className="text-sm font-semibold text-green-800">Back to distributor access</Link>
              <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal Home</p>
              <h1 className="mt-2 text-3xl font-black">Welcome, {companyName}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">This is your distributor home. Use Shop to place a new CowStop order. Open orders, past orders, warranty documents, installation guides, and support will live here.</p>
            </div>
            <button type="button" onClick={signOut} className="rounded border border-neutral-300 px-4 py-2 text-sm font-bold">Sign Out</button>
          </div>

          <nav className="mt-6 flex flex-wrap gap-3 rounded-xl bg-green-50 p-3 ring-1 ring-green-100">
            <Link href="/distributor/home" className="rounded bg-green-800 px-4 py-2 text-sm font-bold text-white">Home</Link>
            <Link href="/distributor/shop" className="rounded bg-white px-4 py-2 text-sm font-bold text-green-900 ring-1 ring-green-200">Shop</Link>
            <Link href="/warranty" className="rounded bg-white px-4 py-2 text-sm font-bold text-green-900 ring-1 ring-green-200">Warranty Packet</Link>
            <Link href="/distributor/documents" className="rounded bg-white px-4 py-2 text-sm font-bold text-green-900 ring-1 ring-green-200">Documents</Link>
            <Link href="/distributor/support" className="rounded bg-white px-4 py-2 text-sm font-bold text-green-900 ring-1 ring-green-200">Support</Link>
          </nav>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <Link href="/distributor/shop" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 hover:ring-green-700">
            <p className="text-sm font-bold uppercase tracking-wide text-green-800">Shop</p>
            <h2 className="mt-2 text-2xl font-black">Place a New Order</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">Order CowStop forms, choose CGF freight, or upload your own BOL.</p>
          </Link>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-bold uppercase tracking-wide text-green-800">Distributor price</p>
            <h2 className="mt-2 text-2xl font-black">{money(pricePerUnit)}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">Current approved distributor price per CowStop form.</p>
          </div>
          <Link href="/warranty" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 hover:ring-green-700">
            <p className="text-sm font-bold uppercase tracking-wide text-green-800">Paperwork</p>
            <h2 className="mt-2 text-2xl font-black">Warranty Packet</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">View or print the customer warranty and support record sheet.</p>
          </Link>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Open Orders</h2>
              <button type="button" onClick={() => void loadOrders()} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold">Refresh</button>
            </div>
            <div className="mt-4 space-y-3">
              {openOrders.length === 0 ? <p className="text-sm text-neutral-600">No open orders found yet.</p> : null}
              {openOrders.map((order) => <div key={order.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="font-bold text-green-950">Order {order.shortId}</p><p className="mt-1 text-xs text-neutral-600">{order.quantityLabel} - {money(order.total)} - {statusLabel(order.status)}</p><p className="mt-1 text-xs text-neutral-600">{order.shipTo}</p><p className="mt-1 text-xs font-bold text-neutral-700">Payment: {statusLabel(order.paymentStatus)}</p></div>)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-black">Past Orders</h2>
            <div className="mt-4 space-y-3">
              {pastOrders.length === 0 ? <p className="text-sm text-neutral-600">Past orders will appear here after orders are completed, delivered, archived, or cancelled.</p> : null}
              {pastOrders.map((order) => <div key={order.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="font-bold text-green-950">Order {order.shortId}</p><p className="mt-1 text-xs text-neutral-600">{order.quantityLabel} - {money(order.total)} - {statusLabel(order.status)}</p><p className="mt-1 text-xs text-neutral-600">{order.shipTo}</p></div>)}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
