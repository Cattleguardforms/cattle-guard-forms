"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type AdminOrder = {
  id: string;
  customer_display_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_type?: string;
  cowstop_quantity?: number;
  quantity?: number;
  payment_status?: string;
  shipment_status?: string;
  checkout_status?: string;
  total?: number;
  bol_number?: string;
  carrier?: string;
  manufacturer_notes?: string;
  created_at?: string;
};

type OrderFile = {
  id: string;
  order_id: string;
  file_type: "original_bol" | "signed_bol" | "shipping_document" | "other_order_attachment";
  file_name: string;
  content_type?: string | null;
  size_bytes?: number | null;
  uploaded_by_role?: string | null;
  created_at?: string | null;
};

type OrdersPayload = {
  ok?: boolean;
  error?: string;
  summary?: {
    activeOrders: number;
    paid: number;
    pendingManufacturer: number;
    readyToShip: number;
  };
  orders?: AdminOrder[];
};

type OrderFilesPayload = {
  ok?: boolean;
  error?: string;
  files?: OrderFile[];
  file?: OrderFile;
  url?: string;
};

type EchoActionResult = {
  ok?: boolean;
  error?: string;
  dryRun?: boolean;
  echoLoadId?: string;
  bolNumber?: string;
  shipmentRequest?: unknown;
  meta?: unknown;
  echoResponse?: unknown;
};

function shortId(id: string) {
  return id ? id.slice(0, 8) : "—";
}

function money(value: unknown) {
  const numberValue = Number(value ?? 0);
  return numberValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function statusText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "—";
}

function fileTypeLabel(type: OrderFile["file_type"]) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function AdminFileControls({
  order,
  files,
  loadingFiles,
  busyAction,
  onLoadFiles,
  onDownloadFile,
  onUploadFile,
}: {
  order: AdminOrder;
  files: OrderFile[];
  loadingFiles: boolean;
  busyAction: string | null;
  onLoadFiles: (orderId: string) => void;
  onDownloadFile: (file: OrderFile) => void;
  onUploadFile: (orderId: string, fileType: OrderFile["file_type"], file: File) => void;
}) {
  const originalBolInputRef = useRef<HTMLInputElement | null>(null);
  const signedBolInputRef = useRef<HTMLInputElement | null>(null);
  const shippingInputRef = useRef<HTMLInputElement | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);
  const isUploading = busyAction?.startsWith(`${order.id}:upload`);

  function handleFileSelection(fileType: OrderFile["file_type"], file?: File) {
    if (file) onUploadFile(order.id, fileType, file);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => originalBolInputRef.current?.click()} disabled={Boolean(isUploading)} className="rounded bg-green-800 px-3 py-2 text-xs font-bold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40">
          Upload Original BOL
        </button>
        <button type="button" onClick={() => signedBolInputRef.current?.click()} disabled={Boolean(isUploading)} className="rounded border border-green-800 px-3 py-2 text-xs font-bold text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40">
          Upload Signed BOL
        </button>
        <button type="button" onClick={() => shippingInputRef.current?.click()} disabled={Boolean(isUploading)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
          Upload Shipping Doc
        </button>
        <button type="button" onClick={() => otherInputRef.current?.click()} disabled={Boolean(isUploading)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
          Upload Other
        </button>
        <button type="button" onClick={() => onLoadFiles(order.id)} disabled={loadingFiles} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
          {loadingFiles ? "Loading..." : "Refresh Files"}
        </button>
      </div>

      <input ref={originalBolInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { handleFileSelection("original_bol", event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={signedBolInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { handleFileSelection("signed_bol", event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={shippingInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { handleFileSelection("shipping_document", event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={otherInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { handleFileSelection("other_order_attachment", event.target.files?.[0]); event.target.value = ""; }} />

      <div className="mt-3 space-y-2">
        {files.length === 0 ? (
          <p className="text-xs text-neutral-500">No order files uploaded yet.</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex flex-col gap-1 rounded-lg bg-white p-2 ring-1 ring-neutral-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900">{fileTypeLabel(file.file_type)}</p>
                <p className="text-xs text-neutral-600">{file.file_name}</p>
              </div>
              <button type="button" onClick={() => onDownloadFile(file)} className="rounded bg-neutral-900 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-700">
                Download
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersPayload["summary"]>({ activeOrders: 0, paid: 0, pendingManufacturer: 0, readyToShip: 0 });
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<EchoActionResult | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filesByOrder, setFilesByOrder] = useState<Record<string, OrderFile[]>>({});
  const [filesLoadingByOrder, setFilesLoadingByOrder] = useState<Record<string, boolean>>({});

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((order) => order.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);

  async function getAccessToken() {
    if (!supabase) throw new Error("Admin auth is not available right now.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return token;
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setOrders([]);
    setSummary({ activeOrders: 0, paid: 0, pendingManufacturer: 0, readyToShip: 0 });
    setActionResult(null);
    setError(null);
    window.location.href = "/admin";
  }

  async function loadOrderFiles(orderId: string) {
    setFilesLoadingByOrder((current) => ({ ...current, [orderId]: true }));
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/order-files?orderId=${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load order files.");
      setFilesByOrder((current) => ({ ...current, [orderId]: payload.files ?? [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order files.");
    } finally {
      setFilesLoadingByOrder((current) => ({ ...current, [orderId]: false }));
    }
  }

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load orders.");
      setOrders(payload.orders ?? []);
      setSummary(payload.summary ?? { activeOrders: 0, paid: 0, pendingManufacturer: 0, readyToShip: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const orderParam = new URLSearchParams(window.location.search).get("order");
    if (orderParam) setSelectedOrderId(orderParam);
  }, []);

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
      await loadOrders();
    }

    void checkSessionAndLoad();
  }, [supabase]);

  useEffect(() => {
    if (selectedOrderId && hasSession) void loadOrderFiles(selectedOrderId);
  }, [selectedOrderId, hasSession]);

  function selectOrder(orderId: string) {
    setSelectedOrderId(orderId);
    window.history.replaceState(null, "", `/admin/orders?order=${encodeURIComponent(orderId)}`);
    void loadOrderFiles(orderId);
  }

  function clearSelectedOrder() {
    setSelectedOrderId(null);
    window.history.replaceState(null, "", "/admin/orders");
  }

  async function uploadOrderFile(orderId: string, fileType: OrderFile["file_type"], file: File) {
    setActionLoading(`${orderId}:upload:${fileType}`);
    setError(null);
    setNotice(null);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("fileType", fileType);
      formData.append("file", file);

      const response = await fetch("/api/order-files", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to upload order file.");
      setNotice(`Uploaded ${fileTypeLabel(fileType)}: ${file.name}`);
      await loadOrderFiles(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload order file.");
    } finally {
      setActionLoading(null);
    }
  }

  async function downloadOrderFile(file: OrderFile) {
    setActionLoading(`file:${file.id}`);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/order-files/download?fileId=${encodeURIComponent(file.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error ?? "Unable to open file download.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open file download.");
    } finally {
      setActionLoading(null);
    }
  }

  async function runEchoBooking(orderId: string, dryRun: boolean) {
    setActionLoading(`${orderId}-${dryRun ? "dry" : "book"}`);
    setActionResult(null);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/echo/book-ltl-shipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, dryRun }),
      });
      const payload = (await response.json()) as EchoActionResult;
      setActionResult(payload);
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Echo booking action failed.");
      if (!dryRun) await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echo booking action failed.");
    } finally {
      setActionLoading(null);
    }
  }

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
            <Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <button onClick={() => void handleSignOut()} className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Sign Out</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Orders</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Active Orders</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Review retail and distributor orders, payment status, fulfillment, BOL/shipping information, order files, and Echo shipment booking.
            </p>
          </div>
          <button onClick={() => void loadOrders()} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
            Refresh Orders
          </button>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Active Orders</p><p className="mt-2 text-3xl font-bold">{summary?.activeOrders ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid</p><p className="mt-2 text-3xl font-bold">{summary?.paid ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pending Manufacturer</p><p className="mt-2 text-3xl font-bold">{summary?.pendingManufacturer ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Ready to Ship</p><p className="mt-2 text-3xl font-bold">{summary?.readyToShip ?? 0}</p></div>
        </div>

        {selectedOrder ? (
          <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-green-800">Selected Order</p>
                <h2 className="mt-2 text-2xl font-black">Order {shortId(selectedOrder.id)}</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  {statusText(selectedOrder.customer_display_name)} · {statusText(selectedOrder.customer_email)} · {Number(selectedOrder.cowstop_quantity ?? selectedOrder.quantity ?? 0)} form(s)
                </p>
              </div>
              <button type="button" onClick={clearSelectedOrder} className="rounded border border-neutral-300 px-3 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                Close Detail
              </button>
            </div>
            <div className="mt-5">
              <AdminFileControls
                order={selectedOrder}
                files={filesByOrder[selectedOrder.id] ?? []}
                loadingFiles={Boolean(filesLoadingByOrder[selectedOrder.id])}
                busyAction={actionLoading}
                onLoadFiles={(orderId) => void loadOrderFiles(orderId)}
                onDownloadFile={(file) => void downloadOrderFile(file)}
                onUploadFile={(orderId, fileType, file) => void uploadOrderFile(orderId, fileType, file)}
              />
            </div>
          </section>
        ) : null}

        {actionResult ? (
          <details open className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <summary className="cursor-pointer font-bold">Latest Echo action result</summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-neutral-950 p-4 text-xs text-neutral-50">{JSON.stringify(actionResult, null, 2)}</pre>
          </details>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer / Distributor</th>
                <th className="px-4 py-3">Email / Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Shipping</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Echo Booking</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-neutral-600">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-neutral-600">No orders found in Supabase.</td></tr>
              ) : (
                orders.map((order) => {
                  const quantity = order.cowstop_quantity ?? order.quantity ?? 0;
                  const isBooked = statusText(order.shipment_status) === "echo_booked";
                  const canBook = statusText(order.payment_status) === "paid" && !isBooked;
                  const fileCount = filesByOrder[order.id]?.length ?? 0;
                  return (
                    <tr key={order.id} className="border-t border-neutral-200 align-top">
                      <td className="px-4 py-4 font-medium">
                        <button type="button" onClick={() => selectOrder(order.id)} className="font-bold text-green-900 hover:underline">{shortId(order.id)}</button>
                        <div className="mt-1 text-xs text-neutral-500">{order.created_at ? new Date(order.created_at).toLocaleString() : ""}</div>
                      </td>
                      <td className="px-4 py-4">{statusText(order.customer_display_name)}</td>
                      <td className="px-4 py-4 text-neutral-600">
                        <div>{statusText(order.customer_email)}</div>
                        <div className="mt-1 text-xs">{statusText(order.customer_phone)}</div>
                      </td>
                      <td className="px-4 py-4">{statusText(order.order_type)}</td>
                      <td className="px-4 py-4">{quantity}</td>
                      <td className="px-4 py-4 font-semibold">{money(order.total)}</td>
                      <td className="px-4 py-4">
                        <div>{statusText(order.payment_status)}</div>
                        <div className="mt-1 text-xs text-neutral-500">checkout: {statusText(order.checkout_status)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>Shipment: {statusText(order.shipment_status)}</div>
                        <div className="mt-1 text-xs text-neutral-500">Carrier: {statusText(order.carrier)}</div>
                        <div className="mt-1 text-xs text-neutral-500">BOL: {statusText(order.bol_number)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => selectOrder(order.id)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-800 hover:border-green-800 hover:bg-green-50">
                          Manage Files {fileCount ? `(${fileCount})` : ""}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => void runEchoBooking(order.id, true)}
                            disabled={!canBook || Boolean(actionLoading)}
                            className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {actionLoading === `${order.id}-dry` ? "Dry running..." : "Dry Run Echo Booking"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void runEchoBooking(order.id, false)}
                            disabled={!canBook || Boolean(actionLoading)}
                            className="rounded bg-green-800 px-3 py-2 text-xs font-bold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {actionLoading === `${order.id}-book` ? "Booking..." : "Book Echo Shipment"}
                          </button>
                          {!canBook ? <p className="text-xs text-neutral-500">Requires paid order and no existing Echo booking.</p> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
