"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type AdminOrder = {
  id: string;
  customer_display_name?: string;
  customer_email?: string;
  customer_phone?: string;
  cowstop_quantity?: number;
  quantity?: number;
  quantity_display?: number;
  payment_status?: string;
  checkout_status?: string;
  status?: string;
  shipment_status?: string;
  total?: number;
  amount_paid?: number;
  amount_display?: number;
  currency?: string;
  carrier?: string | null;
  tracking_link?: string | null;
  bol_number?: string | null;
  created_at?: string;
};

type OrdersPayload = { ok?: boolean; error?: string; summary?: { paidOrders: number; totalPaidRevenue: number; pendingFulfillment: number; shipped: number; delivered: number }; orders?: AdminOrder[] };
type BolPayload = { ok?: boolean; error?: string; checked?: number; results?: { ok?: boolean; skipped?: boolean; reason?: string; filename?: string; orderId?: string }[] };

function shortId(id: string) { return id ? id.slice(0, 8) : "-"; }
function text(value: unknown) { return typeof value === "string" && value.trim() ? value : "-"; }
function money(value: unknown, currency = "USD") { return Number(value ?? 0).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() }); }
function dateText(value: unknown) { const raw = text(value); if (raw === "-") return raw; const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : date.toLocaleString(); }
function qty(order: AdminOrder) { return order.quantity_display ?? order.cowstop_quantity ?? order.quantity ?? 0; }

export default function AdminOrdersPage() {
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersPayload["summary"]>();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function token() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return accessToken;
  }

  async function loadOrders() {
    setLoading(true); setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load orders.");
      setOrders(payload.orders || []);
      setSummary(payload.summary);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load orders."); }
    finally { setLoading(false); }
  }

  async function fetchBol(orderId?: string) {
    setBusy(orderId || "all"); setError(""); setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/fetch-bol-documents", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(orderId ? { orderId } : { limit: 10 }) });
      const payload = (await response.json()) as BolPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to fetch/store Echo BOL.");
      const stored = (payload.results || []).filter((result) => result.filename).length;
      const already = (payload.results || []).filter((result) => result.reason === "bol_file_already_exists").length;
      const missing = (payload.results || []).filter((result) => result.reason === "missing_echo_load_id").length;
      const waiting = (payload.results || []).filter((result) => result.reason === "bol_document_not_available_yet").length;
      setNotice(`Echo BOL recovery checked ${payload.checked ?? 0} order(s). Stored: ${stored}. Already stored: ${already}. Missing Echo booking data: ${missing}. Echo not ready yet: ${waiting}.`);
      await loadOrders();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to fetch/store Echo BOL."); }
    finally { setBusy(""); }
  }

  async function signOut() { if (supabase) await supabase.auth.signOut(); window.location.href = "/admin"; }

  useEffect(() => {
    async function start() {
      if (!supabase) { setError("Admin auth is not available."); setReady(true); setLoading(false); return; }
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) { window.location.href = "/admin"; return; }
      setReady(true); await loadOrders();
    }
    void start();
  }, [supabase]);

  if (!ready) return <main className="min-h-screen bg-neutral-50 px-6 py-10">Checking admin session...</main>;

  return <main className="min-h-screen bg-neutral-50 text-neutral-950"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link><nav className="flex items-center gap-4 text-sm font-medium"><Link href="/admin" className="hover:text-green-800">Dashboard</Link><Link href="/admin/shipping-execution" className="hover:text-green-800">Ship / Execute</Link><button onClick={() => void signOut()} className="rounded border border-neutral-300 px-3 py-2 font-semibold">Sign Out</button></nav></div></header><section className="mx-auto max-w-7xl px-6 py-10"><div className="rounded-2xl border-2 border-blue-700 bg-blue-50 p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-wide text-blue-900">Echo BOL Recovery</p><h1 className="mt-2 text-3xl font-black text-blue-950">Fetch / Store Echo BOL</h1><p className="mt-3 max-w-4xl text-sm leading-6 text-blue-950">This is the recovery control. It is intentionally at the top of Admin Orders. Use the big button to scan recent Echo-booked orders, or use the blue button beside any order below.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => void fetchBol()} disabled={Boolean(busy)} className="rounded bg-blue-800 px-6 py-3 text-sm font-black text-white hover:bg-blue-900 disabled:opacity-60">{busy === "all" ? "Fetching / Storing..." : "Fetch / Store Missing Echo BOLs"}</button><button onClick={() => void loadOrders()} className="rounded border border-blue-800 bg-white px-6 py-3 text-sm font-black text-blue-900 hover:bg-blue-100">Refresh Orders</button><Link href="/admin/shipping-execution" className="rounded border border-blue-800 bg-white px-6 py-3 text-sm font-black text-blue-900 hover:bg-blue-100">Ship / Execute Page</Link></div></div>{error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}{notice ? <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid / Ready Orders</p><p className="mt-2 text-3xl font-bold">{summary?.paidOrders ?? 0}</p></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid Revenue</p><p className="mt-2 text-3xl font-bold">{money(summary?.totalPaidRevenue ?? 0)}</p></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pending Fulfillment</p><p className="mt-2 text-3xl font-bold">{summary?.pendingFulfillment ?? 0}</p></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Shipped</p><p className="mt-2 text-3xl font-bold">{summary?.shipped ?? 0}</p></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Delivered</p><p className="mt-2 text-3xl font-bold">{summary?.delivered ?? 0}</p></div></div><div className="mt-8 rounded-2xl border border-neutral-200 bg-white shadow-sm"><div className="border-b border-neutral-200 p-5"><h2 className="text-2xl font-black">Orders</h2><p className="mt-1 text-sm text-neutral-600">Every row has a visible BOL recovery button. The button is not hidden behind eligibility checks; if Echo data is missing, the action returns that message.</p></div><div className="grid gap-3 p-5">{loading ? <p className="text-sm text-neutral-600">Loading orders...</p> : null}{!loading && orders.length === 0 ? <p className="text-sm text-neutral-600">No paid or ready orders found.</p> : null}{orders.map((order) => <div key={order.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-lg font-black text-green-950">Order {shortId(order.id)}</p><p className="mt-1 text-sm text-neutral-700">{text(order.customer_display_name)} - {text(order.customer_email)}</p><p className="mt-1 text-xs text-neutral-600">Qty: {qty(order)} | Paid: {money(order.amount_display ?? order.amount_paid ?? order.total, order.currency ?? "USD")} | Created: {dateText(order.created_at)}</p><p className="mt-1 text-xs text-neutral-600">Shipment: {text(order.shipment_status)} | Carrier: {text(order.carrier)} | BOL: {text(order.bol_number)}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void fetchBol(order.id)} disabled={Boolean(busy)} className="rounded bg-blue-800 px-4 py-2 text-xs font-black text-white hover:bg-blue-900 disabled:opacity-60">{busy === order.id ? "Fetching..." : "Fetch / Store Echo BOL"}</button><Link href={`/admin/shipping-execution?order=${encodeURIComponent(order.id)}`} className="rounded border border-green-800 bg-white px-4 py-2 text-xs font-black text-green-900 hover:bg-green-50">Ship / Execute</Link></div></div></div>)}</div></div></section></main>;
}
