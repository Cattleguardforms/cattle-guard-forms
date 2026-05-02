"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type BolResult = {
  ok?: boolean;
  skipped?: boolean;
  reason?: string;
  filename?: string;
  orderId?: string;
  shipmentId?: string;
  attemptedPaths?: unknown;
};

type BolPayload = {
  ok?: boolean;
  error?: string;
  checked?: number;
  results?: BolResult[];
};

function resultLabel(result: BolResult) {
  if (result.filename) return `Stored ${result.filename}`;
  if (result.reason === "bol_file_already_exists") return "BOL file already stored";
  if (result.reason === "bol_document_not_available_yet") return "Echo booking found, but Echo has not returned the BOL document yet";
  if (result.reason === "missing_echo_load_id") return "Missing Echo load ID / booking data";
  if (result.reason) return result.reason.replaceAll("_", " ");
  return result.ok ? "Complete" : "No result returned";
}

export default function AdminBolRecoveryPage() {
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [orderId, setOrderId] = useState("");
  const [limit, setLimit] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<BolPayload | null>(null);

  async function getToken() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return token;
  }

  async function fetchBol(targetOrderId?: string) {
    setBusy(true);
    setError("");
    setPayload(null);
    try {
      const token = await getToken();
      const body = targetOrderId ? { orderId: targetOrderId.trim() } : { limit: Number(limit) || 10 };
      const response = await fetch("/api/admin/fetch-bol-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const nextPayload = (await response.json()) as BolPayload;
      if (!response.ok || !nextPayload.ok) throw new Error(nextPayload.error || "Unable to fetch/store Echo BOL.");
      setPayload(nextPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch/store Echo BOL.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-neutral-700">
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/admin/shipping-execution" className="hover:text-green-800">Ship / Execute</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border-2 border-blue-700 bg-blue-50 p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-900">Admin BOL Recovery</p>
          <h1 className="mt-2 text-4xl font-black text-blue-950">Fetch / Store Echo BOL</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-950">
            This page exists only to fetch and store Echo BOL documents. Use the order ID field for one order, or scan recent Echo-booked orders.
          </p>

          <div className="mt-6 grid gap-4 rounded-xl bg-white p-4 ring-1 ring-blue-200">
            <label className="grid gap-2 text-sm font-bold text-blue-950">
              Exact order ID
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Paste the full order ID here"
                className="rounded border border-blue-200 px-3 py-3 font-normal text-neutral-950"
              />
            </label>
            <button
              type="button"
              disabled={busy || !orderId.trim()}
              onClick={() => void fetchBol(orderId)}
              className="rounded bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {busy && orderId.trim() ? "Fetching / Storing..." : "Fetch / Store BOL for This Order"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 rounded-xl bg-white p-4 ring-1 ring-blue-200">
            <label className="grid gap-2 text-sm font-bold text-blue-950">
              Scan recent Echo-booked orders
              <input
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                type="number"
                min="1"
                max="10"
                className="rounded border border-blue-200 px-3 py-3 font-normal text-neutral-950"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void fetchBol()}
              className="rounded bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900 disabled:opacity-50"
            >
              {busy && !orderId.trim() ? "Scanning..." : "Fetch / Store Missing Echo BOLs"}
            </button>
          </div>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        {payload ? (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-black">Result</h2>
            <p className="mt-2 text-sm text-neutral-700">Checked {payload.checked ?? 0} order(s).</p>
            <div className="mt-4 grid gap-3">
              {(payload.results ?? []).map((result, index) => (
                <div key={`${result.orderId || "result"}-${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="font-bold text-neutral-950">Order: {result.orderId || "Unknown"}</p>
                  <p className="mt-1 text-sm text-neutral-700">{resultLabel(result)}</p>
                  {result.shipmentId ? <p className="mt-1 text-xs text-neutral-500">Echo shipment/load: {result.shipmentId}</p> : null}
                </div>
              ))}
            </div>
            <details className="mt-4 rounded-xl bg-neutral-950 p-4 text-neutral-50">
              <summary className="cursor-pointer text-sm font-bold">Raw response</summary>
              <pre className="mt-3 max-h-96 overflow-auto text-xs">{JSON.stringify(payload, null, 2)}</pre>
            </details>
          </section>
        ) : null}
      </section>
    </main>
  );
}
