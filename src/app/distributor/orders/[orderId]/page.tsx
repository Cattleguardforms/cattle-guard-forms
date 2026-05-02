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

type OrderFile = {
  id: string;
  order_id: string;
  file_type: string;
  file_name: string;
  content_type?: string;
  size_bytes?: number;
  uploaded_by_role?: string;
  created_at?: string;
};

type OrdersPayload = { ok?: boolean; error?: string; orders?: DistributorOrder[] };
type FilesPayload = { ok?: boolean; error?: string; files?: OrderFile[] };
type DownloadPayload = { ok?: boolean; error?: string; url?: string; fileName?: string };

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

function fileTypeLabel(value?: string) {
  if (!value) return "Order file";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isBolFile(file: OrderFile) {
  const fileType = (file.file_type || "").toLowerCase();
  const fileName = (file.file_name || "").toLowerCase();
  return fileType.includes("bol") || fileName.includes("bol");
}

function DetailRow({ labelText, value }: { labelText: string; value?: string }) {
  return <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{labelText}</p><p className="mt-1 text-sm font-bold text-neutral-950">{value || "Not available"}</p></div>;
}

export default function DistributorOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [order, setOrder] = useState<DistributorOrder | null>(null);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadingFileId, setDownloadingFileId] = useState("");

  const bolFiles = files.filter(isBolFile);

  async function getToken() {
    if (!supabase) throw new Error("Distributor auth unavailable.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Distributor sign-in is required.");
    return token;
  }

  async function loadFiles(token: string) {
    setFileError("");
    const response = await fetch(`/api/order-files?orderId=${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token}` } });
    const payload = (await response.json()) as FilesPayload;
    if (!response.ok || !payload.ok) {
      setFileError(payload.error || "Unable to load order files.");
      setFiles([]);
      return;
    }
    setFiles(payload.files ?? []);
  }

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/distributor/orders", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load distributor orders.");
      const found = (payload.orders ?? []).find((item) => item.id === orderId) ?? null;
      if (!found) throw new Error("Order not found for this distributor account.");
      setOrder(found);
      await loadFiles(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadFile(fileId: string) {
    setFileError("");
    setDownloadingFileId(fileId);
    try {
      const token = await getToken();
      const response = await fetch(`/api/order-files/download?fileId=${encodeURIComponent(fileId)}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as DownloadPayload;
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error || "Unable to create download link.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Unable to download file.");
    } finally {
      setDownloadingFileId("");
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

  <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-bold">BOL / Freight Document</p><p className="mt-2">BOL Code: <span className="font-mono font-bold text-neutral-950">{order.bolNumber || "Pending"}</span></p><p className="mt-2">The BOL number can appear before the downloadable BOL file. The download button will appear after the freight document is generated by Echo or uploaded and stored with this order.</p></div><button type="button" onClick={() => void loadOrder()} className="rounded border border-amber-700 bg-white px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100">Refresh Files</button></div>{fileError ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{fileError}</div> : null}{bolFiles.length ? <div className="mt-4 grid gap-3">{bolFiles.map((file) => <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-neutral-950">{file.file_name || "BOL document"}</p><p className="mt-1 text-xs text-neutral-600">{fileTypeLabel(file.file_type)}{file.created_at ? ` • ${dateLabel(file.created_at)}` : ""}</p></div><button type="button" onClick={() => void downloadFile(file.id)} disabled={downloadingFileId === file.id} className="rounded bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-60">{downloadingFileId === file.id ? "Preparing..." : "Download BOL"}</button></div>)}</div> : <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4"><p className="font-bold text-neutral-950">No downloadable BOL file is available yet.</p><p className="mt-1 text-sm text-neutral-700">If a BOL code is shown above, freight booking has a reference number but the document has not been stored yet. Once the BOL document is fetched or uploaded, the Download BOL button will appear here.</p></div>}</section>
</section></main>;
}
