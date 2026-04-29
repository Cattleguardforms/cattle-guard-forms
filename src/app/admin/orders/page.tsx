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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersPayload["summary"]>({ activeOrders: 0, paid: 0, pendingManufacturer: 0, readyToShip: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<EchoActionResult | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function getAccessToken() {
    if (!supabase) throw new Error("Admin auth is not available right now.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return token;
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
    void loadOrders();
  }, [supabase]);

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

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Orders</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Active Orders</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Review retail and distributor orders, payment status, fulfillment, BOL/shipping information, and Echo shipment booking.
            </p>
          </div>
          <button onClick={() => void loadOrders()} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
            Refresh Orders
          </button>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Active Orders</p><p className="mt-2 text-3xl font-bold">{summary?.activeOrders ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid</p><p className="mt-2 text-3xl font-bold">{summary?.paid ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pending Manufacturer</p><p className="mt-2 text-3xl font-bold">{summary?.pendingManufacturer ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Ready to Ship</p><p className="mt-2 text-3xl font-bold">{summary?.readyToShip ?? 0}</p></div>
        </div>

        {actionResult ? (
          <details open className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <summary className="cursor-pointer font-bold">Latest Echo action result</summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-neutral-950 p-4 text-xs text-neutral-50">{JSON.stringify(actionResult, null, 2)}</pre>
          </details>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[1100px] text-left text-sm">
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
                <th className="px-4 py-3">Echo Booking</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-600">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-600">No orders found in Supabase.</td></tr>
              ) : (
                orders.map((order) => {
                  const quantity = order.cowstop_quantity ?? order.quantity ?? 0;
                  const isBooked = statusText(order.shipment_status) === "echo_booked";
                  const canBook = statusText(order.payment_status) === "paid" && !isBooked;
                  return (
                    <tr key={order.id} className="border-t border-neutral-200 align-top">
                      <td className="px-4 py-4 font-medium">
                        <div>{shortId(order.id)}</div>
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
