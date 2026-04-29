"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const SHIPMENT_STATUSES = ["pending", "ready_for_fulfillment", "preparing", "ready_to_ship", "shipped", "delivered", "delayed", "cancelled"];
const ORDER_STATUSES = ["ready_for_fulfillment", "preparing", "ready_to_ship", "shipped", "delivered", "cancelled"];

type AdminOrder = {
  id: string;
  customer_display_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_type?: string;
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
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  carrier?: string | null;
  tracking_link?: string | null;
  bol_number?: string | null;
  ship_date?: string | null;
  estimated_delivery_date?: string | null;
  number_of_pallets?: number | null;
  freight_class?: number | null;
  manufacturer_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type OrdersPayload = {
  ok?: boolean;
  error?: string;
  summary?: {
    paidOrders: number;
    totalPaidRevenue: number;
    pendingFulfillment: number;
    preparing: number;
    shipped: number;
    delivered: number;
    archived: number;
    visible: number;
  };
  orders?: AdminOrder[];
  order?: AdminOrder;
};

type FulfillmentForm = {
  shipment_status: string;
  status: string;
  carrier: string;
  tracking_link: string;
  bol_number: string;
  ship_date: string;
  estimated_delivery_date: string;
  number_of_pallets: string;
  freight_class: string;
  manufacturer_notes: string;
};

function shortId(id: string) {
  return id ? id.slice(0, 8) : "—";
}

function money(value: unknown, currency = "USD") {
  const numberValue = Number(value ?? 0);
  return numberValue.toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() });
}

function statusText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "—";
}

function dateText(value: unknown) {
  const text = statusText(value);
  if (text === "—") return text;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

function dateInputValue(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  return value.slice(0, 10);
}

function buildForm(order: AdminOrder): FulfillmentForm {
  return {
    shipment_status: order.shipment_status ?? "pending",
    status: order.status ?? "ready_for_fulfillment",
    carrier: order.carrier ?? "",
    tracking_link: order.tracking_link ?? "",
    bol_number: order.bol_number ?? "",
    ship_date: dateInputValue(order.ship_date),
    estimated_delivery_date: dateInputValue(order.estimated_delivery_date),
    number_of_pallets: order.number_of_pallets == null ? "" : String(order.number_of_pallets),
    freight_class: order.freight_class == null ? "150" : String(order.freight_class),
    manufacturer_notes: order.manufacturer_notes ?? "",
  };
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-950">{statusText(value)}</p>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersPayload["summary"]>({ paidOrders: 0, totalPaidRevenue: 0, pendingFulfillment: 0, preparing: 0, shipped: 0, delivered: 0, archived: 0, visible: 0 });
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [form, setForm] = useState<FulfillmentForm | null>(null);

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
    setError(null);
    window.location.href = "/admin";
  }

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load orders.");
      setOrders(payload.orders ?? []);
      setSummary(payload.summary ?? { paidOrders: 0, totalPaidRevenue: 0, pendingFulfillment: 0, preparing: 0, shipped: 0, delivered: 0, archived: 0, visible: 0 });
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
    if (selectedOrder) setForm(buildForm(selectedOrder));
  }, [selectedOrder]);

  function selectOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setNotice(null);
    window.history.replaceState(null, "", `/admin/orders?order=${encodeURIComponent(orderId)}`);
  }

  function clearSelectedOrder() {
    setSelectedOrderId(null);
    setForm(null);
    window.history.replaceState(null, "", "/admin/orders");
  }

  async function saveFulfillment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder || !form) return;

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: selectedOrder.id, updates: form }),
      });
      const payload = (await response.json()) as OrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to update fulfillment fields.");
      setNotice(`Saved fulfillment updates for order ${shortId(selectedOrder.id)}.`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update fulfillment fields.");
    } finally {
      setSaving(false);
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
            <button onClick={() => void handleSignOut()} className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Sign Out</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Orders</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Paid Orders & Fulfillment</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Real Supabase-backed paid order management. Echo freight quoting and booking controls are intentionally excluded from this screen until the Echo rates response is finalized.
            </p>
          </div>
          <button onClick={() => void loadOrders()} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
            Refresh Orders
          </button>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid / Ready Orders</p><p className="mt-2 text-3xl font-bold">{summary?.paidOrders ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Paid Revenue</p><p className="mt-2 text-3xl font-bold">{money(summary?.totalPaidRevenue ?? 0)}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pending Fulfillment</p><p className="mt-2 text-3xl font-bold">{summary?.pendingFulfillment ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Shipped</p><p className="mt-2 text-3xl font-bold">{summary?.shipped ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Delivered</p><p className="mt-2 text-3xl font-bold">{summary?.delivered ?? 0}</p></div>
        </div>

        {selectedOrder && form ? (
          <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-green-800">Order Detail</p>
                <h2 className="mt-2 text-2xl font-black">Order {shortId(selectedOrder.id)}</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  {statusText(selectedOrder.customer_display_name)} · {statusText(selectedOrder.customer_email)} · {selectedOrder.quantity_display ?? selectedOrder.cowstop_quantity ?? selectedOrder.quantity ?? 0} form(s)
                </p>
              </div>
              <button type="button" onClick={clearSelectedOrder} className="rounded border border-neutral-300 px-3 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                Close Detail
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <DetailRow label="Amount Paid" value={money(selectedOrder.amount_display ?? selectedOrder.amount_paid ?? selectedOrder.total, selectedOrder.currency ?? "USD")} />
              <DetailRow label="Checkout Status" value={selectedOrder.checkout_status} />
              <DetailRow label="Paid At" value={dateText(selectedOrder.paid_at)} />
              <DetailRow label="Stripe Session" value={selectedOrder.stripe_checkout_session_id} />
              <DetailRow label="Payment Intent" value={selectedOrder.stripe_payment_intent_id} />
              <DetailRow label="Current Shipment" value={selectedOrder.shipment_status} />
            </div>

            <form onSubmit={(event) => void saveFulfillment(event)} className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-lg font-black">Fulfillment Update</h3>
              <p className="mt-1 text-sm text-neutral-600">Update shipping and production fields directly in Supabase.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-neutral-800">
                  Shipment status
                  <select value={form.shipment_status} onChange={(event) => setForm({ ...form, shipment_status: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2">
                    {SHIPMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Order status
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2">
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Carrier
                  <input value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" placeholder="Carrier name" />
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Tracking link
                  <input value={form.tracking_link} onChange={(event) => setForm({ ...form, tracking_link: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" placeholder="https://..." />
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  BOL number
                  <input value={form.bol_number} onChange={(event) => setForm({ ...form, bol_number: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Number of pallets
                  <input value={form.number_of_pallets} onChange={(event) => setForm({ ...form, number_of_pallets: event.target.value })} type="number" min="0" className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Freight class
                  <input value={form.freight_class} onChange={(event) => setForm({ ...form, freight_class: event.target.value })} type="number" min="0" className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Ship date
                  <input value={form.ship_date} onChange={(event) => setForm({ ...form, ship_date: event.target.value })} type="date" className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-semibold text-neutral-800">
                  Estimated delivery date
                  <input value={form.estimated_delivery_date} onChange={(event) => setForm({ ...form, estimated_delivery_date: event.target.value })} type="date" className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-semibold text-neutral-800 md:col-span-2">
                  Manufacturer notes
                  <textarea value={form.manufacturer_notes} onChange={(event) => setForm({ ...form, manufacturer_notes: event.target.value })} rows={4} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2" />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button disabled={saving} className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? "Saving..." : "Save Fulfillment Updates"}
                </button>
                <button type="button" onClick={() => setForm(buildForm(selectedOrder))} className="rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-800 hover:bg-neutral-50">
                  Reset Form
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer / Distributor</th>
                <th className="px-4 py-3">Email / Phone</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Checkout</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Shipment</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-600">Loading paid orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-600">No paid or ready-for-fulfillment orders found in Supabase.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-neutral-200 align-top">
                    <td className="px-4 py-4 font-medium">
                      <button type="button" onClick={() => selectOrder(order.id)} className="font-bold text-green-900 hover:underline">{shortId(order.id)}</button>
                      <div className="mt-1 text-xs text-neutral-500">{dateText(order.created_at)}</div>
                    </td>
                    <td className="px-4 py-4">{statusText(order.customer_display_name)}</td>
                    <td className="px-4 py-4 text-neutral-600">
                      <div>{statusText(order.customer_email)}</div>
                      <div className="mt-1 text-xs">{statusText(order.customer_phone)}</div>
                    </td>
                    <td className="px-4 py-4">{order.quantity_display ?? order.cowstop_quantity ?? order.quantity ?? 0}</td>
                    <td className="px-4 py-4 font-semibold">{money(order.amount_display ?? order.amount_paid ?? order.total, order.currency ?? "USD")}</td>
                    <td className="px-4 py-4">
                      <div>{statusText(order.checkout_status)}</div>
                      <div className="mt-1 text-xs text-neutral-500">payment: {statusText(order.payment_status)}</div>
                    </td>
                    <td className="px-4 py-4">{statusText(order.status)}</td>
                    <td className="px-4 py-4">
                      <div>{statusText(order.shipment_status)}</div>
                      <div className="mt-1 text-xs text-neutral-500">Carrier: {statusText(order.carrier)}</div>
                      <div className="mt-1 text-xs text-neutral-500">BOL: {statusText(order.bol_number)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => selectOrder(order.id)} className="rounded bg-green-800 px-3 py-2 text-xs font-bold text-white hover:bg-green-900">
                        Open / Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
