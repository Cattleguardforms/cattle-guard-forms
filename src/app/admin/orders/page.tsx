"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const FILE_TYPE_OPTIONS = [
  { value: "original_bol", label: "BOL / Customer-provided BOL" },
  { value: "signed_bol", label: "Signed BOL" },
  { value: "shipping_document", label: "Shipping document" },
  { value: "other_order_attachment", label: "Other order document" },
];

type AdminOrder = {
  id: string;
  order_type?: string;
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
  ship_date?: string | null;
  estimated_delivery_date?: string | null;
  created_at?: string;
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

type OrdersPayload = { ok?: boolean; error?: string; summary?: { paidOrders: number; totalPaidRevenue: number; pendingFulfillment: number; shipped: number; delivered: number }; orders?: AdminOrder[] };
type FilesPayload = { ok?: boolean; error?: string; files?: OrderFile[]; file?: OrderFile };
type DownloadPayload = { ok?: boolean; error?: string; url?: string; fileName?: string };
type BolPayload = { ok?: boolean; error?: string; checked?: number; results?: { ok?: boolean; skipped?: boolean; reason?: string; filename?: string; orderId?: string }[] };

function shortId(id: string) { return id ? id.slice(0, 8) : "-"; }
function text(value: unknown) { return typeof value === "string" && value.trim() ? value : "-"; }
function money(value: unknown, currency = "USD") { return Number(value ?? 0).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() }); }
function dateText(value: unknown) { const raw = text(value); if (raw === "-") return raw; const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : date.toLocaleString(); }
function qty(order: AdminOrder) { return order.quantity_display ?? order.cowstop_quantity ?? order.quantity ?? 0; }
function fileLabel(file: OrderFile) { return (file.file_type || "order_file").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function isBolFile(file: OrderFile) { const name = (file.file_name || "").toLowerCase(); const type = (file.file_type || "").toLowerCase(); return name.includes("bol") || type.includes("bol") || (type === "shipping_document" && name.includes("echo")); }
function warrantyHref(order: AdminOrder) { return (order.order_type || "").toLowerCase() === "distributor" ? `/distributor/orders/${order.id}/warranty` : `/warranty/${order.id}`; }
function warrantyLabel(order: AdminOrder) { return (order.order_type || "").toLowerCase() === "distributor" ? "Open Distributor Warranty" : "Open Customer Warranty"; }

export default function AdminOrdersPage() {
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersPayload["summary"]>();
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [downloadingFileId, setDownloadingFileId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFileValue, setUploadFileValue] = useState<File | null>(null);
  const [uploadFileType, setUploadFileType] = useState("other_order_attachment");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null;
  const bolFiles = files.filter(isBolFile);
  const otherFiles = files.filter((file) => !isBolFile(file));

  async function token() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return accessToken;
  }

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load orders.");
      setOrders(payload.orders || []);
      setSummary(payload.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles(orderId: string) {
    if (!orderId) return;
    setFilesLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch(`/api/order-files?orderId=${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as FilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load order files.");
      setFiles(payload.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order files.");
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }

  async function selectOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setNotice("");
    setUploadFileValue(null);
    setUploadFileType("other_order_attachment");
    await loadFiles(orderId);
  }

  async function fetchBol(orderId: string) {
    setBusy(orderId);
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
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to fetch/store Echo BOL.");
      const first = payload.results?.[0];
      if (first?.filename) setNotice(`BOL stored: ${first.filename}`);
      else if (first?.reason === "bol_file_already_exists") setNotice("BOL file is already stored for this order.");
      else if (first?.reason === "missing_echo_load_id") setNotice("This order is missing Echo booking/load data.");
      else if (first?.reason === "bol_document_not_available_yet") setNotice("Echo has not returned the downloadable BOL yet.");
      else setNotice("BOL recovery completed. Refreshing files.");
      await loadFiles(orderId);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch/store Echo BOL.");
    } finally {
      setBusy("");
    }
  }

  async function uploadOrderFile(orderId: string) {
    setUploading(true);
    setError("");
    setNotice("");
    try {
      if (!uploadFileValue) throw new Error("Choose a file to upload first.");
      const accessToken = await token();
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("fileType", uploadFileType);
      formData.append("file", uploadFileValue);
      const response = await fetch("/api/order-files", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const payload = (await response.json()) as FilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to upload order document.");
      setNotice(`Uploaded ${payload.file?.file_name || uploadFileValue.name}.`);
      setUploadFileValue(null);
      const input = document.getElementById("admin-order-file-upload") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadFiles(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload order document.");
    } finally {
      setUploading(false);
    }
  }

  async function downloadFile(fileId: string) {
    setDownloadingFileId(fileId);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch(`/api/order-files/download?fileId=${encodeURIComponent(fileId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as DownloadPayload;
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error || "Unable to create download link.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download file.");
    } finally {
      setDownloadingFileId("");
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  useEffect(() => {
    async function start() {
      if (!supabase) { setError("Admin auth is not available."); setReady(true); setLoading(false); return; }
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) { window.location.href = "/admin"; return; }
      setReady(true);
      await loadOrders();
    }
    void start();
  }, [supabase]);

  if (!ready) return <main className="min-h-screen bg-neutral-50 px-6 py-10">Checking admin session...</main>;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/shipping-execution" className="hover:text-green-800">Ship / Execute</Link>
            <button onClick={() => void signOut()} className="rounded border border-neutral-300 px-3 py-2 font-semibold">Sign Out</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-green-800">Admin / Orders</p>
            <h1 className="mt-2 text-3xl font-black">Orders Board</h1>
            <p className="mt-2 text-sm text-neutral-600">Open an order to fetch, upload, or download BOLs and order documents.</p>
          </div>
          <button onClick={() => void loadOrders()} className="rounded border border-green-800 bg-white px-5 py-3 text-sm font-black text-green-900 hover:bg-green-50">Refresh Orders</button>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid / Ready Orders</p><p className="mt-2 text-3xl font-bold">{summary?.paidOrders ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid Revenue</p><p className="mt-2 text-3xl font-bold">{money(summary?.totalPaidRevenue ?? 0)}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pending Fulfillment</p><p className="mt-2 text-3xl font-bold">{summary?.pendingFulfillment ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Shipped</p><p className="mt-2 text-3xl font-bold">{summary?.shipped ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Delivered</p><p className="mt-2 text-3xl font-bold">{summary?.delivered ?? 0}</p></div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-5"><h2 className="text-2xl font-black">Orders</h2><p className="mt-1 text-sm text-neutral-600">Click an order to manage documents and freight actions.</p></div>
            <div className="max-h-[720px] overflow-auto p-5">
              {loading ? <p className="text-sm text-neutral-600">Loading orders...</p> : null}
              {!loading && orders.length === 0 ? <p className="text-sm text-neutral-600">No paid or ready orders found.</p> : null}
              <div className="grid gap-3">
                {orders.map((order) => (
                  <button key={order.id} type="button" onClick={() => void selectOrder(order.id)} className={`rounded-xl border p-4 text-left hover:border-green-800 hover:bg-green-50 ${selectedOrderId === order.id ? "border-green-800 bg-green-50" : "border-neutral-200 bg-neutral-50"}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="font-black text-green-950">Order {shortId(order.id)}</p><p className="mt-1 text-sm text-neutral-700">{text(order.customer_display_name)}</p><p className="mt-1 text-xs text-neutral-600">{text(order.customer_email)}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-neutral-200">{text(order.shipment_status)}</span></div>
                    <p className="mt-2 text-xs text-neutral-600">Qty: {qty(order)} | Paid: {money(order.amount_display ?? order.amount_paid ?? order.total, order.currency ?? "USD")}</p><p className="mt-1 text-xs text-neutral-600">Carrier: {text(order.carrier)} | BOL: {text(order.bol_number)}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-5"><h2 className="text-2xl font-black">Order Detail</h2><p className="mt-1 text-sm text-neutral-600">Customer, shipment, BOL, warranty, and document actions.</p></div>
            {!selectedOrder ? <div className="p-6 text-sm text-neutral-600">Select an order from the left.</div> : (
              <div className="p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <Detail label="Order" value={selectedOrder.id} /><Detail label="Order Type" value={text(selectedOrder.order_type)} /><Detail label="Customer / Distributor" value={text(selectedOrder.customer_display_name)} /><Detail label="Email" value={text(selectedOrder.customer_email)} /><Detail label="Phone" value={text(selectedOrder.customer_phone)} /><Detail label="Quantity" value={String(qty(selectedOrder))} /><Detail label="Amount" value={money(selectedOrder.amount_display ?? selectedOrder.amount_paid ?? selectedOrder.total, selectedOrder.currency ?? "USD")} /><Detail label="Payment" value={text(selectedOrder.payment_status)} /><Detail label="Shipment" value={text(selectedOrder.shipment_status)} /><Detail label="Carrier" value={text(selectedOrder.carrier)} /><Detail label="BOL Number" value={text(selectedOrder.bol_number)} /><Detail label="Created" value={dateText(selectedOrder.created_at)} /><Detail label="Estimated Delivery" value={dateText(selectedOrder.estimated_delivery_date)} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => void fetchBol(selectedOrder.id)} disabled={Boolean(busy)} className="rounded bg-blue-800 px-4 py-3 text-sm font-black text-white hover:bg-blue-900 disabled:opacity-60">{busy === selectedOrder.id ? "Fetching BOL..." : "Fetch BOL"}</button>
                  <Link href={`/admin/shipping-execution?order=${encodeURIComponent(selectedOrder.id)}`} className="rounded bg-green-800 px-4 py-3 text-sm font-black text-white hover:bg-green-900">Book / Manage Shipment</Link>
                  <Link href={warrantyHref(selectedOrder)} className="rounded border border-green-800 bg-white px-4 py-3 text-sm font-black text-green-900 hover:bg-green-50">{warrantyLabel(selectedOrder)}</Link>
                  {selectedOrder.tracking_link ? <Link href={selectedOrder.tracking_link} className="rounded border border-neutral-300 bg-white px-4 py-3 text-sm font-black text-neutral-800 hover:bg-neutral-50">Open Tracking</Link> : null}
                  <button type="button" onClick={() => void loadFiles(selectedOrder.id)} className="rounded border border-neutral-300 bg-white px-4 py-3 text-sm font-black text-neutral-800 hover:bg-neutral-50">Refresh Files</button>
                </div>

                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
                  <h3 className="text-lg font-black text-green-950">Upload Documents</h3>
                  <p className="mt-1 text-sm text-green-950">Upload customer-provided BOLs, signed BOLs, shipping documents, photos, PDFs, or other special order documents directly to this order.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="grid gap-2 text-sm font-bold text-green-950">Document type<select value={uploadFileType} onChange={(event) => setUploadFileType(event.target.value)} className="rounded border border-green-200 bg-white px-3 py-2 font-normal text-neutral-950">{FILE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-green-950">Choose file<input id="admin-order-file-upload" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setUploadFileValue(event.target.files?.[0] || null)} className="rounded border border-green-200 bg-white px-3 py-2 font-normal text-neutral-950" /></label>
                    <button type="button" disabled={uploading || !uploadFileValue} onClick={() => void uploadOrderFile(selectedOrder.id)} className="rounded bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? "Uploading..." : "Upload"}</button>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4"><h3 className="text-lg font-black">BOL Downloads</h3>{filesLoading ? <p className="mt-2 text-sm text-neutral-600">Loading files...</p> : null}{!filesLoading && bolFiles.length === 0 ? <p className="mt-2 text-sm text-neutral-600">No BOL file is stored yet. Click Fetch BOL or upload a BOL above.</p> : null}<div className="mt-3 grid gap-2">{bolFiles.map((file) => <FileRow key={file.id} file={file} downloadingFileId={downloadingFileId} onDownload={downloadFile} primary />)}</div></div>

                <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4"><h3 className="text-lg font-black">All Order Files</h3>{!filesLoading && files.length === 0 ? <p className="mt-2 text-sm text-neutral-600">No stored order files yet.</p> : null}<div className="mt-3 grid gap-2">{otherFiles.map((file) => <FileRow key={file.id} file={file} downloadingFileId={downloadingFileId} onDownload={downloadFile} />)}</div></div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-neutral-950">{value}</p></div>;
}

function FileRow({ file, downloadingFileId, onDownload, primary = false }: { file: OrderFile; downloadingFileId: string; onDownload: (fileId: string) => void; primary?: boolean }) {
  return <div className={`flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between ${primary ? "border-blue-200 bg-blue-50" : "border-neutral-200 bg-neutral-50"}`}><div><p className="font-bold text-neutral-950">{file.file_name || "Order file"}</p><p className="mt-1 text-xs text-neutral-600">{fileLabel(file)}{file.created_at ? ` | ${dateText(file.created_at)}` : ""}{file.size_bytes ? ` | ${Math.round(file.size_bytes / 1024)} KB` : ""}</p></div><button type="button" onClick={() => onDownload(file.id)} disabled={downloadingFileId === file.id} className={`rounded px-4 py-2 text-sm font-black text-white disabled:opacity-60 ${primary ? "bg-blue-800 hover:bg-blue-900" : "bg-green-800 hover:bg-green-900"}`}>{downloadingFileId === file.id ? "Preparing..." : primary ? "Download BOL" : "Download File"}</button></div>;
}
