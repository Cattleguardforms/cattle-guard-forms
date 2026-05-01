"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DistributorNav from "../../DistributorNav";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type DistributorOrder = {
  id: string;
  shortId: string;
  quantityLabel: string;
  quantity?: number;
  total: number;
  paymentStatus: string;
  checkoutStatus?: string;
  shipmentStatus?: string;
  status: string;
  shippingMethod?: string;
  selectedRate?: string;
  freightCharge?: number;
  carrier?: string;
  bolNumber?: string;
  trackingLink?: string;
  shipTo: string;
  createdAt?: string;
};

type OrdersPayload = { ok?: boolean; error?: string; orders?: DistributorOrder[] };

function money(value?: number) {
  return Number(value ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function label(value?: string) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function DetailRow({ labelText, value }: { labelText: string; value?: string }) {
  return <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{labelText}</p><p className="mt-1 text-sm font-bold text-neutral-950">{value || "Not available"}</p></div>;
}

export default function DistributorOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [order, setOrder] = useState<DistributorOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Distributor auth unavailable.");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Distributor sign-in is required.");
      const response = await fetch("/api/distributor/orders", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load distributor orders.");
      const found = (payload.orders ?? []).find((item) => item.id === orderId) ?? null;
      if (!found) throw new Error("Order not found for this distributor account.");
      setOrder(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadOrder(); }, [orderId, supabase]);

  if (loading) return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">Loading order...</main>;

  if (error || !order) {
    return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950"><section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><Link href="/distributor/home" className="text-sm font-semibold text-green-800">Back to Distributor Home</Link><div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error || "Order unavailable."}</div></section></main>;
  }

  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950"><section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><Link href="/distributor/home" className="text-sm font-semibold text-green-800">Back to Distributor Home</Link><p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor Order Detail</p><div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-3xl font-black">Order {order.shortId}</h1><p className="mt-2 text-sm leading-6 text-neutral-700">Review order status, shipping/BOL information, warranty paperwork, and customer-ready documents.</p></div><button type="button" onClick={() => void loadOrder()} className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-bold hover:bg-neutral-50">Refresh</button></div><DistributorNav active="home" />

  <div className="mt-6 grid gap-4 md:grid-cols-3"><DetailRow labelText="Order Status" value={label(order.status)} /><DetailRow labelText="Payment" value={label(order.paymentStatus)} /><DetailRow labelText="Shipment" value={label(order.shipmentStatus)} /><DetailRow labelText="Quantity" value={order.quantityLabel} /><DetailRow labelText="Total" value={money(order.total)} /><DetailRow labelText="Created" value={dateLabel(order.createdAt)} /><DetailRow labelText="Shipping Method" value={label(order.shippingMethod)} /><DetailRow labelText="Selected Rate" value={order.selectedRate} /><DetailRow labelText="Freight Charge" value={money(order.freightCharge)} /></div>

  <section className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5"><h2 className="text-xl font-black text-green-950">Ship-To / Freight</h2><p className="mt-3 text-sm leading-6 text-neutral-700">{order.shipTo}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><DetailRow labelText="Carrier" value={order.carrier} /><DetailRow labelText="BOL Number" value={order.bolNumber} /><DetailRow labelText="Tracking" value={order.trackingLink ? "Available" : "Not available"} /></div><div className="mt-4 flex flex-wrap gap-3">{order.trackingLink ? <Link href={order.trackingLink} className="rounded bg-blue-800 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900">Open Tracking</Link> : null}<Link href={`/distributor/orders/${order.id}/warranty`} className="rounded bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900">Warranty Paperwork</Link><Link href="/distributor/documents" className="rounded border border-green-800 bg-white px-4 py-2 text-sm font-bold text-green-900 hover:bg-green-50">Documents / Packets</Link></div></section>

  <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-bold">BOL file status</p><p className="mt-2">Your BOL will appear here after freight booking is completed and the shipment document is available. If the BOL is not available yet, the order is still in fulfillment review or awaiting shipment document confirmation.</p></section>
</section></main>;
}
