"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

type Payload = {
  ok?: boolean;
  error?: string;
  summary?: {
    readyForFulfillment: number;
    echoBooked: number;
    readyToShip: number;
    shipped: number;
    total: number;
  };
  orders?: Order[];
};

type OrderFilesPayload = {
  ok?: boolean;
  error?: string;
  files?: OrderFile[];
  file?: OrderFile;
  url?: string;
};

function show(value?: string) {
  return value && value.trim() ? value : "Not set";
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-neutral-200">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function OrderActions({
  order,
  files,
  loadingFiles,
  busyAction,
  onRefreshFiles,
  onDownloadOriginalBol,
  onDownloadFile,
  onUpload,
}: {
  order: Order;
  files: OrderFile[];
  loadingFiles: boolean;
  busyAction: string | null;
  onRefreshFiles: (order: Order) => void;
  onDownloadOriginalBol: (order: Order) => void;
  onDownloadFile: (file: OrderFile) => void;
  onUpload: (order: Order, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const originalBol = files.find((file) => file.file_type === "original_bol");
  const signedBols = files.filter((file) => file.file_type === "signed_bol");
  const isUploading = busyAction === `${order.id}:upload`;
  const isDownloadingOriginal = busyAction === `${order.id}:download-original`;

  return (
    <div className="flex min-w-48 flex-col gap-2">
      <Link href={`/admin/orders?order=${order.id}`} className="rounded border border-neutral-300 px-3 py-2 text-center text-xs font-bold text-neutral-900 hover:border-green-800 hover:bg-green-50">
        View Order
      </Link>
      <button
        type="button"
        className="rounded bg-green-800 px-3 py-2 text-xs font-bold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!originalBol || isDownloadingOriginal}
        onClick={() => onDownloadOriginalBol(order)}
      >
        {isDownloadingOriginal ? "Opening BOL..." : originalBol ? "Download Original BOL" : "No Original BOL"}
      </button>
      <button
        type="button"
        className="rounded border border-green-800 px-3 py-2 text-xs font-bold text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Uploading..." : "Upload Signed BOL"}
      </button>
      <button
        type="button"
        className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loadingFiles}
        onClick={() => onRefreshFiles(order)}
      >
        {loadingFiles ? "Loading files..." : "Refresh Files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(order, file);
          event.target.value = "";
        }}
      />
      {signedBols.length > 0 ? (
        <div className="rounded-lg bg-neutral-50 p-2 text-xs text-neutral-700 ring-1 ring-neutral-200">
          <p className="font-bold text-neutral-900">Signed BOLs</p>
          <div className="mt-1 flex flex-col gap-1">
            {signedBols.slice(0, 3).map((file) => (
              <button key={file.id} type="button" className="text-left font-semibold text-green-800 hover:underline" onClick={() => onDownloadFile(file)}>
                {file.file_name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ManufacturerPortalPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Payload["summary"]>({
    readyForFulfillment: 0,
    echoBooked: 0,
    readyToShip: 0,
    shipped: 0,
    total: 0,
  });
  const [filesByOrder, setFilesByOrder] = useState<Record<string, OrderFile[]>>({});
  const [filesLoadingByOrder, setFilesLoadingByOrder] = useState<Record<string, boolean>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function getToken() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin session not found. Sign in from the admin portal.");
    return token;
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  async function loadOrderFiles(orderId: string) {
    setFilesLoadingByOrder((current) => ({ ...current, [orderId]: true }));
    try {
      const token = await getToken();
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
      const token = await getToken();
      const response = await fetch("/api/admin/manufacturer-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = (await response.json()) as Payload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to load manufacturer orders.");
      }

      const nextOrders = payload.orders ?? [];
      setOrders(nextOrders);
      setSummary(
        payload.summary ?? {
          readyForFulfillment: 0,
          echoBooked: 0,
          readyToShip: 0,
          shipped: 0,
          total: 0,
        },
      );

      await Promise.all(nextOrders.map((order) => loadOrderFiles(order.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load manufacturer orders.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadFile(file: OrderFile, actionKey = `file:${file.id}`) {
    setBusyAction(actionKey);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`/api/order-files/download?fileId=${encodeURIComponent(file.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error ?? "Unable to open file download.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open file download.");
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadOriginalBol(order: Order) {
    const originalBol = filesByOrder[order.id]?.find((file) => file.file_type === "original_bol");
    if (!originalBol) {
      setNotice(`No original BOL has been uploaded for order ${order.shortId} yet.`);
      return;
    }
    await downloadFile(originalBol, `${order.id}:download-original`);
  }

  async function handleSignedBolUpload(order: Order, file: File) {
    setBusyAction(`${order.id}:upload`);
    setError(null);
    setNotice(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("fileType", "signed_bol");
      formData.append("file", file);

      const response = await fetch("/api/order-files", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to upload signed BOL.");

      setNotice(`Uploaded signed BOL for order ${order.shortId}: ${file.name}`);
      await loadOrderFiles(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload signed BOL.");
    } finally {
      setBusyAction(null);
    }
  }

  useEffect(() => {
    if (!supabase) {
      setError("Admin auth is not available.");
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) {
        window.location.href = "/admin";
        return;
      }

      void loadOrders();
    });
  }, [supabase]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-black text-green-900">
            Cattle Guard Forms
          </Link>
          <nav className="flex items-center gap-5 text-sm font-semibold text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Admin</Link>
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing</Link>
            <button onClick={() => void signOut()} className="rounded border border-neutral-300 px-3 py-2 hover:bg-neutral-50">
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-green-200">Manufacturer Portal</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl font-black tracking-tight">Live Fulfillment Orders</h1>
              <p className="mt-4 max-w-3xl text-green-50">
                Paid and ready-for-fulfillment orders from Supabase.
              </p>
            </div>
            <button onClick={() => void loadOrders()} className="rounded bg-white px-5 py-3 text-sm font-bold text-green-950 hover:bg-green-50">
              Refresh Orders
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-7 max-w-7xl px-6">
        <div className="grid gap-4 md:grid-cols-5">
          <Card label="Total" value={summary?.total ?? 0} />
          <Card label="Ready" value={summary?.readyForFulfillment ?? 0} />
          <Card label="Echo Booked" value={summary?.echoBooked ?? 0} />
          <Card label="Ready to Ship" value={summary?.readyToShip ?? 0} />
          <Card label="Shipped" value={summary?.shipped ?? 0} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {notice}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Ship To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Carrier / BOL</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Actions</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-600">
                    Loading manufacturer orders...
                  </td>
                </tr>
              ) : null}

              {!loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-600">
                    No paid fulfillment orders found.
                  </td>
                </tr>
              ) : null}

              {!loading &&
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-neutral-200 align-top">
                    <td className="px-4 py-4 font-bold text-green-950">
                      {order.shortId}
                      <p className="mt-1 text-xs font-normal text-neutral-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{order.customer}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {show(order.contactEmail)} / {show(order.contactPhone)}
                      </p>
                    </td>
                    <td className="px-4 py-4">{order.quantityLabel}</td>
                    <td className="px-4 py-4 text-neutral-700">{order.shipTo}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
                        {show(order.status)}
                      </span>
                      <p className="mt-2 text-xs text-neutral-500">Payment: {show(order.paymentStatus)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>Carrier: {show(order.carrier)}</p>
                      <p className="mt-1 text-xs text-neutral-500">BOL: {show(order.bolNumber)}</p>
                      {order.trackingLink ? (
                        <a href={order.trackingLink} className="mt-1 block text-xs font-bold text-green-800" target="_blank" rel="noreferrer">
                          Tracking link
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p>Ship: {show(order.shipDate)}</p>
                      <p className="mt-1 text-xs text-neutral-500">ETA: {show(order.estimatedDeliveryDate)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <OrderActions
                        order={order}
                        files={filesByOrder[order.id] ?? []}
                        loadingFiles={Boolean(filesLoadingByOrder[order.id])}
                        busyAction={busyAction}
                        onRefreshFiles={(selectedOrder) => void loadOrderFiles(selectedOrder.id)}
                        onDownloadOriginalBol={(selectedOrder) => void downloadOriginalBol(selectedOrder)}
                        onDownloadFile={(file) => void downloadFile(file)}
                        onUpload={(selectedOrder, file) => void handleSignedBolUpload(selectedOrder, file)}
                      />
                    </td>
                    <td className="px-4 py-4 text-neutral-700">{show(order.manufacturerNotes)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
