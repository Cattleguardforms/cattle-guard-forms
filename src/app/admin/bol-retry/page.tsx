"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type BolRetryOrder = {
  id: string;
  order_type: string;
  customer_name: string;
  customer_email: string;
  payment_status: string;
  checkout_status: string;
  shipment_status: string;
  carrier: string;
  bol_number: string;
  echo_load_id: string;
  has_echo_booking: boolean;
  amount: number;
  created_at: string;
  updated_at: string;
  retry_reason: string;
};

type QueuePayload = { ok?: boolean; error?: string; count?: number; orders?: BolRetryOrder[] };
type BolPayload = { ok?: boolean; error?: string; checked?: number; results?: { ok?: boolean; skipped?: boolean; reason?: string; filename?: string; orderId?: string }[] };

function shortId(id: string) {
  return id ? id.slice(0, 8) : "-";
}

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dateText(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminBolRetryPage() {
  const [orders, setOrders] = useState<BolRetryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function token() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return accessToken;
  }

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/bol-retry-queue", { headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as QueuePayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load BOL retry queue.");
      setOrders(payload.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load BOL retry queue.");
    } finally {
      setLoading(false);
    }
  }

  async function retryBol(orderId: string) {
    setRetryingId(orderId);
    setError("");
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/fetch-bol-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ orderId }),
      });
      const payload = (await response.json()) as BolPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to retry BOL fetch.");
      const first = payload.results?.[0];
      if (first?.filename) setNotice(`BOL stored for order ${shortId(orderId)}: ${first.filename}`);
      else if (first?.reason === "bol_file_already_exists") setNotice(`BOL is already stored for order ${shortId(orderId)}.`);
      else if (first?.reason === "bol_document_not_available_yet") setNotice(`Echo has not returned the BOL yet for order ${shortId(orderId)}. Try again later.`);
      else if (first?.reason === "missing_echo_load_id") setNotice(`Order ${shortId(orderId)} is missing Echo booking/load data.`);
      else setNotice(`BOL retry completed for order ${shortId(orderId)}.`);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry BOL fetch.");
    } finally {
      setRetryingId("");
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  useEffect(() => {
    void loadQueue();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/admin/shipping-execution" className="hover:text-green-800">Ship / Execute</Link>
            <button onClick={() => void signOut()} className="rounded border border-neutral-300 px-3 py-2 font-semibold">Sign Out</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-bold uppercase tracking-wide text-green-800">Admin / Fulfillment Hardening</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">BOL Retry Queue</h1>
          <p className="mt-4 max-w-4xl leading-7 text-neutral-700">
            Shows real paid or ready live orders where a BOL file is not stored yet. Use this queue to retry Echo BOL retrieval before an order falls through the cracks.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => void loadQueue()} disabled={loading} className="rounded bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900 disabled:opacity-60">{loading ? "Refreshing..." : "Refresh Queue"}</button>
            <Link href="/admin/orders" className="rounded border border-green-800 bg-white px-5 py-3 text-sm font-black text-green-900 hover:bg-green-50">Open Orders Board</Link>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Missing BOL Orders</p><p className="mt-2 text-3xl font-bold">{orders.length}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">With Echo Booking</p><p className="mt-2 text-3xl font-bold">{orders.filter((order) => order.has_echo_booking).length}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Missing Echo Marker</p><p className="mt-2 text-3xl font-bold">{orders.filter((order) => !order.has_echo_booking).length}</p></div>
        </div>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-black">Orders Needing BOL Attention</h2>
          {loading ? <p className="mt-4 text-sm text-neutral-600">Loading BOL queue...</p> : null}
          {!loading && orders.length === 0 ? <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-900 ring-1 ring-green-200">No missing BOL orders found.</p> : null}
          <div className="mt-5 grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                      <span className="rounded-full bg-white px-2 py-1 text-green-800 ring-1 ring-green-200">{order.order_type || "customer"}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-neutral-700 ring-1 ring-neutral-200">{order.shipment_status || "shipment pending"}</span>
                      <span className={`rounded-full px-2 py-1 ring-1 ${order.has_echo_booking ? "bg-blue-50 text-blue-800 ring-blue-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>{order.has_echo_booking ? "Echo booking found" : "Missing Echo marker"}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black">Order {shortId(order.id)} — {order.customer_name}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{order.customer_email || "No customer email"}</p>
                    <p className="mt-3 text-sm leading-6 text-neutral-700">{order.retry_reason}</p>
                    <div className="mt-4 grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
                      <Info label="Amount" value={money(order.amount)} />
                      <Info label="Carrier" value={order.carrier || "-"} />
                      <Info label="BOL Number" value={order.bol_number || "-"} />
                      <Info label="Echo Load" value={order.echo_load_id || "-"} />
                      <Info label="Created" value={dateText(order.created_at)} />
                      <Info label="Updated" value={dateText(order.updated_at)} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <button onClick={() => void retryBol(order.id)} disabled={Boolean(retryingId)} className="rounded bg-blue-800 px-4 py-3 text-sm font-black text-white hover:bg-blue-900 disabled:opacity-60">{retryingId === order.id ? "Retrying..." : "Retry Fetch BOL"}</button>
                    <Link href={`/admin/orders`} className="rounded border border-green-800 bg-white px-4 py-3 text-center text-sm font-black text-green-900 hover:bg-green-50">Open Orders Board</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 break-words font-bold text-neutral-950">{value}</p></div>;
}
