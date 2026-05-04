"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type Order = {
  id: string;
  shortId: string;
  customer: string;
  contactEmail: string;
  contactPhone: string;
  quantityLabel: string;
  shipTo: string;
  status: string;
  paymentStatus: string;
  carrier: string;
  bolNumber: string;
  trackingLink: string;
  shipDate: string;
  estimatedDeliveryDate: string;
  manufacturerNotes: string;
  createdAt: string;
};

type OrderFile = { id: string; order_id: string; file_type: string; file_name: string; created_at?: string | null };
type OrdersPayload = { ok?: boolean; error?: string; summary?: { readyForFulfillment: number; echoBooked: number; readyToShip: number; shipped: number; total: number }; orders?: Order[] };
type FilesPayload = { ok?: boolean; error?: string; files?: OrderFile[]; url?: string };
type ShippedPayload = { ok?: boolean; error?: string; emailNotification?: { ok?: boolean; error?: string } };

function show(value?: string) { return value && value.trim() ? value : "Not set"; }
function Card({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>; }

export default function ManufacturerPortalPage() {
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({ readyForFulfillment: 0, echoBooked: 0, readyToShip: 0, shipped: 0, total: 0 });
  const [filesByOrder, setFilesByOrder] = useState<Record<string, OrderFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function getToken() {
    if (!supabase) throw new Error("Manufacturer auth is not available.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Manufacturer sign-in is required.");
    return token;
  }

  async function loadFiles(orderId: string, activeToken?: string) {
    try {
      const token = activeToken ?? (await getToken());
      const response = await fetch(`/api/order-files?orderId=${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as FilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load order files.");
      setFilesByOrder((current) => ({ ...current, [orderId]: payload.files || [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order files.");
    }
  }

  async function loadOrders(activeToken?: string) {
    setLoading(true);
    setError("");
    try {
      const token = activeToken ?? (await getToken());
      const response = await fetch("/api/admin/manufacturer-orders", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load manufacturer orders.");
      const nextOrders = payload.orders || [];
      setOrders(nextOrders);
      setSummary(payload.summary || { readyForFulfillment: 0, echoBooked: 0, readyToShip: 0, shipped: 0, total: 0 });
      await Promise.all(nextOrders.map((order) => loadFiles(order.id, token)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load manufacturer orders.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadFile(file: OrderFile) {
    setBusy(file.id); setError("");
    try {
      const token = await getToken();
      const response = await fetch(`/api/order-files/download?fileId=${encodeURIComponent(file.id)}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as FilesPayload;
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error || "Unable to download file.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to download file."); }
    finally { setBusy(""); }
  }

  async function uploadSignedBol(orderId: string, file: File) {
    setBusy(orderId); setError(""); setNotice("");
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("fileType", "signed_bol");
      formData.append("file", file);
      const response = await fetch("/api/order-files", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const payload = (await response.json()) as FilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to upload signed BOL.");
      setNotice(`Uploaded signed BOL: ${file.name}`);
      await loadFiles(orderId, token);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to upload signed BOL."); }
    finally { setBusy(""); }
  }

  async function markShipped(orderId: string) {
    setBusy(`${orderId}:shipped`); setError(""); setNotice("");
    try {
      const token = await getToken();
      const response = await fetch("/api/manufacturer/mark-shipped", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId }) });
      const payload = (await response.json()) as ShippedPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to mark order shipped.");
      setNotice(payload.emailNotification?.ok === false ? `Order marked shipped, but email failed: ${payload.emailNotification.error}` : "Order marked shipped and shipment emails were sent.");
      await loadOrders(token);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to mark order shipped."); }
    finally { setBusy(""); }
  }

  async function signOut() { if (supabase) await supabase.auth.signOut(); window.location.href = "/manufacturer/login"; }

  useEffect(() => { async function start() { if (!supabase) { setError("Manufacturer auth is not available."); setLoading(false); return; } const { data } = await supabase.auth.getSession(); const token = data.session?.access_token; if (!token) { window.location.href = "/manufacturer/login"; return; } await loadOrders(token); } void start(); }, [supabase]);

  return <main className="min-h-screen bg-neutral-50 text-neutral-950"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="font-black text-green-900">Cattle Guard Forms</Link><nav className="flex items-center gap-5 text-sm font-semibold text-neutral-700"><Link href="/manufacturer/forgot-password" className="hover:text-green-800">Forgot Password</Link><button onClick={() => void signOut()} className="rounded border border-neutral-300 px-3 py-2 hover:bg-neutral-50">Sign Out</button></nav></div></header><section className="bg-green-950 text-white"><div className="mx-auto max-w-7xl px-6 py-12"><p className="text-sm font-bold uppercase tracking-[0.24em] text-green-200">Manufacturer Portal</p><div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-5xl font-black tracking-tight">Live Fulfillment Orders</h1><p className="mt-4 max-w-3xl text-green-50">Paid and ready-for-fulfillment orders.</p></div><button onClick={() => void loadOrders()} className="rounded bg-white px-5 py-3 text-sm font-bold text-green-950 hover:bg-green-50">Refresh Orders</button></div></div></section><section className="mx-auto -mt-7 max-w-7xl px-6"><div className="grid gap-4 md:grid-cols-5"><Card label="Total" value={summary.total} /><Card label="Ready" value={summary.readyForFulfillment} /><Card label="Echo Booked" value={summary.echoBooked} /><Card label="Ready to Ship" value={summary.readyToShip} /><Card label="Shipped" value={summary.shipped} /></div></section><section className="mx-auto max-w-7xl px-6 py-10">{error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}{notice ? <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}<div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Ship To</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Carrier / BOL</th><th className="px-4 py-3">Files / Shipping</th><th className="px-4 py-3">Notes</th></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-600">Loading manufacturer orders...</td></tr> : null}{!loading && orders.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-600">No paid fulfillment orders found.</td></tr> : null}{!loading && orders.map((order) => { const files = filesByOrder[order.id] || []; const originalBol = files.find((file) => file.file_type === "original_bol"); const signedBols = files.filter((file) => file.file_type === "signed_bol"); const shipped = (order.status || "").toLowerCase() === "shipped"; return <tr key={order.id} className="border-t border-neutral-200 align-top"><td className="px-4 py-4 font-bold text-green-950">{order.shortId}<p className="mt-1 text-xs font-normal text-neutral-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</p></td><td className="px-4 py-4"><p>{order.customer}</p><p className="mt-1 text-xs text-neutral-500">{show(order.contactEmail)} / {show(order.contactPhone)}</p></td><td className="px-4 py-4">{order.quantityLabel}</td><td className="px-4 py-4 text-neutral-700">{order.shipTo}</td><td className="px-4 py-4"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">{show(order.status)}</span><p className="mt-2 text-xs text-neutral-500">Payment: {show(order.paymentStatus)}</p></td><td className="px-4 py-4"><p>Carrier: {show(order.carrier)}</p><p className="mt-1 text-xs text-neutral-500">BOL: {show(order.bolNumber)}</p>{order.trackingLink ? <a href={order.trackingLink} className="mt-1 block text-xs font-bold text-green-800" target="_blank" rel="noreferrer">Tracking link</a> : null}</td><td className="px-4 py-4"><div className="flex flex-col gap-2"><button disabled={!originalBol || Boolean(busy)} onClick={() => originalBol && void downloadFile(originalBol)} className="rounded bg-green-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{originalBol ? "Download Original BOL" : "No Original BOL"}</button><label className="rounded border border-green-800 px-3 py-2 text-center text-xs font-bold text-green-900 hover:bg-green-50">Upload Signed BOL<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadSignedBol(order.id, file); event.target.value = ""; }} /></label><button onClick={() => void loadFiles(order.id)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700">Refresh Files</button><button disabled={shipped || busy === `${order.id}:shipped`} onClick={() => void markShipped(order.id)} className="rounded bg-blue-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{shipped ? "Order Shipped" : busy === `${order.id}:shipped` ? "Sending..." : "Mark Order Shipped"}</button>{signedBols.slice(0, 3).map((file) => <button key={file.id} onClick={() => void downloadFile(file)} className="text-left text-xs font-bold text-green-800 hover:underline">{file.file_name}</button>)}</div></td><td className="px-4 py-4 text-neutral-700">{show(order.manufacturerNotes)}</td></tr>; })}</tbody></table></div></section></main>;
}
