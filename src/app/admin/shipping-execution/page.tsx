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
  quantity_display?: number;
  cowstop_quantity?: number;
  quantity?: number;
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
  manufacturer_notes?: string | null;
  selected_rate?: string | null;
  freight_charge?: number | null;
  created_at?: string;
};

type OrdersPayload = { ok?: boolean; error?: string; orders?: AdminOrder[] };
type ActionPayload = {
  ok?: boolean;
  error?: string;
  bolNumber?: string;
  echoLoadId?: string;
  echoResponse?: unknown;
  shipmentRequest?: unknown;
  status?: number;
  statusText?: string;
  attemptedPaths?: unknown;
  recipients?: string[];
  bolFileName?: string;
  result?: unknown;
  checked?: number;
  results?: unknown[];
};

function shortId(id: string) { return id ? id.slice(0, 8) : "-"; }
function money(value: unknown, currency = "USD") { return Number(value ?? 0).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() }); }
function statusText(value: unknown) { return typeof value === "string" && value.trim() ? value : "-"; }
function dateText(value: unknown) { if (typeof value !== "string" || !value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }
function quantity(order: AdminOrder) { return order.quantity_display ?? order.cowstop_quantity ?? order.quantity ?? 0; }

export default function AdminShippingExecutionPage() {
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [fetchingBol, setFetchingBol] = useState(false);
  const [sendingManufacturer, setSendingManufacturer] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastResult, setLastResult] = useState<ActionPayload | null>(null);

  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;
  const executableOrders = orders.filter((order) => ["paid", "complete"].includes((order.payment_status || order.checkout_status || "").toLowerCase()) || Number(order.amount_display ?? order.amount_paid ?? order.total ?? 0) > 0);
  const isBusy = executing || fetchingBol || sendingManufacturer;

  async function getToken() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin sign-in is required.");
    return token;
  }

  async function loadOrders() {
    setLoading(true); setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/orders?scope=all", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load admin orders.");
      setOrders(payload.orders ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load admin orders."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadOrders(); }, [supabase]);

  async function executeShipment(orderId: string, dryRunMode: boolean) {
    setExecuting(true); setError(""); setNotice(""); setLastResult(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/echo/book-ltl-shipment", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId, dryRun: dryRunMode }) });
      const payload = (await response.json()) as ActionPayload;
      setLastResult(payload);
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Echo shipment booking failed.");
      setNotice(dryRunMode ? "Echo dry run built successfully. Review the request below before booking." : `Echo shipment booked. BOL code ${payload.bolNumber || "created"}. The downloadable BOL file will be stored by the BOL fetch workflow when Echo provides the document.`);
      await loadOrders();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to execute Echo shipment."); }
    finally { setExecuting(false); }
  }

  async function fetchBol(orderId: string) {
    setFetchingBol(true); setError(""); setNotice(""); setLastResult(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/fetch-bol-documents", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId }) });
      const payload = (await response.json()) as ActionPayload;
      setLastResult(payload);
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Stored BOL fetch failed.");
      const firstResult = Array.isArray(payload.results) ? (payload.results[0] as { ok?: boolean; skipped?: boolean; reason?: string; filename?: string } | undefined) : undefined;
      if (firstResult?.ok && firstResult.filename) {
        setNotice(`Stored Echo BOL document: ${firstResult.filename}. Distributor portal Download BOL should appear after refresh.`);
      } else if (firstResult?.skipped && firstResult.reason === "bol_file_already_exists") {
        setNotice("A BOL file is already stored for this order. Open the distributor order detail or order files to download it.");
      } else if (firstResult?.reason === "bol_document_not_available_yet") {
        setNotice("Echo booking exists, but the BOL document is not available yet. The scheduled job will keep checking.");
      } else {
        setNotice("BOL fetch completed. Review the result details below for the current status.");
      }
      await loadOrders();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to fetch/store Echo BOL."); }
    finally { setFetchingBol(false); }
  }

  async function sendManufacturerOrder(orderId: string) {
    setSendingManufacturer(true); setError(""); setNotice(""); setLastResult(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/send-manufacturer-order", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId }) });
      const payload = (await response.json()) as ActionPayload;
      setLastResult(payload);
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Manufacturer email failed.");
      setNotice(`Manufacturer email sent to ${(payload.recipients ?? []).join(", ") || "configured recipients"} with ${payload.bolFileName || "BOL attachment"}.`);
      await loadOrders();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to send manufacturer email."); }
    finally { setSendingManufacturer(false); }
  }

  return <main className="min-h-screen bg-neutral-50 text-neutral-950"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link><nav className="flex items-center gap-6 text-sm font-medium text-neutral-700"><Link href="/admin/orders" className="hover:text-green-800">Orders</Link><Link href="/admin/shipping-execution" className="text-green-900 underline decoration-green-800 decoration-2 underline-offset-8">Ship / Execute</Link><Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link></nav></div></header><section className="mx-auto max-w-7xl px-6 py-12"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Shipping execution</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Book Echo Shipment / Store BOL</h1><p className="mt-4 max-w-3xl leading-8 text-neutral-700">Execute paid orders, book Echo LTL shipments, fetch and store Echo BOL documents for portal download, and send the manufacturer packet once the BOL exists.</p></div><button onClick={() => void loadOrders()} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">Refresh Orders</button></div>{error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}{notice ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}<div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"><section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Paid / Ready Orders</h2><p className="mt-2 text-sm text-neutral-600">Select an order to book Echo shipment, fetch/store its BOL file, or send the manufacturer packet.</p><div className="mt-5 max-h-[620px] space-y-3 overflow-auto pr-2">{loading ? <p className="text-sm text-neutral-600">Loading orders...</p> : null}{!loading && executableOrders.length === 0 ? <p className="text-sm text-neutral-600">No executable paid orders found.</p> : null}{executableOrders.map((order) => <button key={order.id} type="button" onClick={() => { setSelectedId(order.id); setLastResult(null); setError(""); setNotice(""); }} className={selectedId === order.id ? "w-full rounded-xl border border-green-700 bg-green-50 p-4 text-left" : "w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left hover:border-green-700 hover:bg-green-50"}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-green-950">Order {shortId(order.id)}</p><p className="mt-1 text-sm text-neutral-700">{statusText(order.customer_display_name)}</p><p className="mt-1 text-xs text-neutral-500">{quantity(order)} form(s) - {money(order.amount_display ?? order.amount_paid ?? order.total, order.currency ?? "USD")}</p></div><span className="rounded bg-white px-2 py-1 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">{statusText(order.shipment_status)}</span></div><p className="mt-2 text-xs text-neutral-500">Carrier: {statusText(order.carrier)} | BOL Code: {statusText(order.bol_number)}</p></button>)}</div></section><section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">{!selectedOrder ? <div><h2 className="text-xl font-black">Select an order</h2><p className="mt-2 text-sm text-neutral-600">Choose an order from the left to review and execute shipping.</p></div> : <div><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-green-800">Selected order</p><h2 className="mt-2 text-2xl font-black">Order {shortId(selectedOrder.id)}</h2><p className="mt-2 text-sm text-neutral-600">{statusText(selectedOrder.customer_display_name)} - {statusText(selectedOrder.customer_email)}</p></div><Link href={`/admin/orders?order=${encodeURIComponent(selectedOrder.id)}`} className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-800 hover:bg-neutral-50">Open order detail</Link></div><div className="mt-6 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase text-neutral-500">Quantity</p><p className="mt-1 font-bold">{quantity(selectedOrder)} form(s)</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase text-neutral-500">Payment</p><p className="mt-1 font-bold">{statusText(selectedOrder.payment_status || selectedOrder.checkout_status)}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase text-neutral-500">Selected rate</p><p className="mt-1 text-sm font-bold">{statusText(selectedOrder.selected_rate)}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase text-neutral-500">Freight charge</p><p className="mt-1 font-bold">{money(selectedOrder.freight_charge ?? 0)}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase text-neutral-500">Current carrier</p><p className="mt-1 font-bold">{statusText(selectedOrder.carrier)}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase text-neutral-500">BOL Code</p><p className="mt-1 font-bold">{statusText(selectedOrder.bol_number)}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 md:col-span-2"><p className="text-xs font-bold uppercase text-neutral-500">Created</p><p className="mt-1 font-bold">{dateText(selectedOrder.created_at)}</p></div></div><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">Execution rules</p><p className="mt-1">Use dry run first. Book the shipment once. After Echo returns a BOL code, use Fetch / Store Echo BOL to save the actual document into order files. The distributor portal downloads from stored order files, not from a direct browser-only BOL download.</p></div><div className="mt-5 flex flex-wrap gap-3"><button disabled={isBusy} onClick={() => void executeShipment(selectedOrder.id, true)} className="rounded border border-green-800 bg-white px-5 py-3 text-sm font-bold text-green-900 hover:bg-green-50 disabled:opacity-50">Dry Run Echo Request</button><button disabled={isBusy} onClick={() => void executeShipment(selectedOrder.id, false)} className="rounded bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-50">{executing ? "Executing..." : "Book / Execute Shipment"}</button><button disabled={isBusy || !selectedOrder.bol_number} onClick={() => void fetchBol(selectedOrder.id)} className="rounded bg-blue-800 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-50">{fetchingBol ? "Fetching / Storing BOL..." : "Fetch / Store Echo BOL"}</button><button disabled={isBusy || !selectedOrder.bol_number} onClick={() => void sendManufacturerOrder(selectedOrder.id)} className="rounded bg-amber-700 px-5 py-3 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50">{sendingManufacturer ? "Sending..." : "Send Manufacturer Email"}</button></div>{lastResult ? <details className="mt-6 rounded-xl border border-neutral-200 bg-neutral-950 p-4 text-neutral-50" open><summary className="cursor-pointer text-sm font-bold">Result / request details</summary><pre className="mt-3 max-h-96 overflow-auto text-xs">{JSON.stringify(lastResult, null, 2)}</pre></details> : null}</div>}</section></div></section></main>;
}
