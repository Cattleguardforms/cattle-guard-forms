import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type SearchParams = Promise<{ period?: string }>;

const COWSTOP_UNIT_COST = 348.98;
const SHIPPING_COGS_RATE = 0.15;
const PERIODS = [
  ["all", "All time"],
  ["year", "Year to date"],
  ["quarter", "Quarter to date"],
  ["month", "Month to date"],
] as const;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function percent(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%";
}

function orderDate(order: Row) {
  return clean(order.paid_at) || clean(order.created_at) || clean(order.updated_at) || new Date().toISOString();
}

function orderAmount(order: Row) {
  return numberValue(order.amount_display ?? order.amount_paid ?? order.total ?? order.order_total ?? order.price_total);
}

function orderQuantity(order: Row) {
  return numberValue(order.quantity_display ?? order.cowstop_quantity ?? order.quantity ?? order.forms_quantity ?? 0);
}

function shippingReserve(order: Row) {
  return orderAmount(order) * SHIPPING_COGS_RATE;
}

function actualShippingCost(order: Row) {
  return numberValue(
    order.actual_shipping_cost ??
    order.shipping_cost_actual ??
    order.shipping_actual_cost ??
    order.freight_charge ??
    order.shipping_cost ??
    order.freight_cost ??
    order.ltl_cost ??
    order.echo_cost ??
    0,
  );
}

function shippingCostForProfit(order: Row) {
  const actual = actualShippingCost(order);
  return actual > 0 ? actual : shippingReserve(order);
}

function isFakeOrTestOrder(order: Row) {
  const orderType = clean(order.order_type).toLowerCase();
  const customerEmail = clean(order.customer_email || order.contact_email || order.email || order.order_contact_email).toLowerCase();
  const customerName = clean(order.customer_name || order.contact_name).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  const source = clean(order.source || order.checkout_source || order.lead_source).toLowerCase();
  return orderType.includes("sandbox") || orderType.includes("test") || source.includes("sandbox") || source.includes("test") || sessionId.startsWith("cs_test_") || customerEmail.includes("neroa.io") || customerName.includes("thomas farrell");
}

function isPaid(order: Row) {
  if (isFakeOrTestOrder(order)) return false;
  const payment = clean(order.payment_status).toLowerCase();
  const checkout = clean(order.checkout_status).toLowerCase();
  const status = clean(order.status).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  return payment === "paid" || checkout === "paid" || checkout === "complete" || checkout === "succeeded" || status === "ready_for_fulfillment" || sessionId.startsWith("cs_live_");
}

function periodStart(period: string) {
  const now = new Date();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "quarter") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

function inPeriod(order: Row, period: string) {
  const start = periodStart(period);
  if (!start) return true;
  const date = new Date(orderDate(order));
  return !Number.isNaN(date.getTime()) && date >= start;
}

function customerName(order: Row) {
  return clean(order.customer_name) || clean(order.customer_display_name) || clean(order.company_name) || clean(order.raw_vendor_name) || clean(order.normalized_vendor_name) || "Customer / Distributor";
}

async function loadOrders(period: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).filter(isPaid).filter((order) => inPeriod(order, period));
}

function groupByMonth(orders: Row[]) {
  const map = new Map<string, { label: string; orders: number; units: number; revenue: number; reserve: number; actualShipping: number; cogs: number; profit: number }>();
  for (const order of orders) {
    const date = new Date(orderDate(order));
    const label = Number.isNaN(date.getTime()) ? "Unknown" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const revenue = orderAmount(order);
    const units = orderQuantity(order);
    const reserve = shippingReserve(order);
    const actualShipping = actualShippingCost(order);
    const cogs = units * COWSTOP_UNIT_COST + shippingCostForProfit(order);
    const existing = map.get(label) ?? { label, orders: 0, units: 0, revenue: 0, reserve: 0, actualShipping: 0, cogs: 0, profit: 0 };
    existing.orders += 1;
    existing.units += units;
    existing.revenue += revenue;
    existing.reserve += reserve;
    existing.actualShipping += actualShipping;
    existing.cogs += cogs;
    existing.profit += revenue - cogs;
    map.set(label, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.label.localeCompare(a.label));
}

export default async function AdminProfitPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const selectedPeriod = PERIODS.some(([value]) => value === params.period) ? String(params.period) : "month";
  let orders: Row[] = [];
  let error = "";
  try {
    orders = await loadOrders(selectedPeriod);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load order profitability.";
  }

  const revenue = orders.reduce((sum, order) => sum + orderAmount(order), 0);
  const units = orders.reduce((sum, order) => sum + orderQuantity(order), 0);
  const productCogs = units * COWSTOP_UNIT_COST;
  const shippingReserveTotal = orders.reduce((sum, order) => sum + shippingReserve(order), 0);
  const actualShippingTotal = orders.reduce((sum, order) => sum + actualShippingCost(order), 0);
  const shippingUsedForProfit = orders.reduce((sum, order) => sum + shippingCostForProfit(order), 0);
  const ordersWithActualShipping = orders.filter((order) => actualShippingCost(order) > 0).length;
  const totalCogs = productCogs + shippingUsedForProfit;
  const profit = revenue - totalCogs;
  const margin = revenue ? (profit / revenue) * 100 : 0;
  const monthly = groupByMonth(orders);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/admin/analytics" className="hover:text-green-800">Analytics</Link>
            <Link href="/marketing/sales-analytics" className="hover:text-green-800">Sales Analytics</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Profitability</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Revenue, COGS, Shipping, and Actual Profit</h1>
          <p className="mt-4 max-w-4xl leading-7 text-neutral-700">
            Pulls from real paid live orders. COGS uses {money(COWSTOP_UNIT_COST)} per CowStop form, shows the 15% shipping reserve, and uses the actual freight charge when one is stored on the order. Test, sandbox, fake, unpaid, and pending orders are excluded.
          </p>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Profit dashboard failed to load: {error}</div> : null}

        <form action="/admin/profit" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <label className="grid gap-2 text-sm font-bold text-neutral-700">Period
            <select name="period" defaultValue={selectedPeriod} className="rounded border border-neutral-300 px-3 py-2 font-normal">
              {PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="rounded bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Apply</button>
        </form>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <Metric label="Revenue" value={money(revenue)} />
          <Metric label="Orders" value={String(orders.length)} />
          <Metric label="Units" value={String(units)} />
          <Metric label="CowStop COGS" value={money(productCogs)} note={`${money(COWSTOP_UNIT_COST)} x ${units} unit(s)`} />
          <Metric label="Shipping Reserve" value={money(shippingReserveTotal)} note="15% of revenue" />
          <Metric label="Actual Shipping" value={money(actualShippingTotal)} note={`${ordersWithActualShipping} order(s) with freight charge`} />
          <Metric label="Actual Profit" value={money(profit)} note={`${percent(margin)} margin`} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-black">Profit Formula</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              <p className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Revenue: {money(revenue)}</p>
              <p className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">CowStop COGS: {money(COWSTOP_UNIT_COST)} x {units} unit(s) = {money(productCogs)}</p>
              <p className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Shipping reserve: {money(shippingReserveTotal)} at 15% of revenue</p>
              <p className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Actual shipping: {money(actualShippingTotal)} across {ordersWithActualShipping} order(s). Profit uses actual shipping when stored, otherwise the 15% reserve.</p>
              <p className="rounded-lg bg-green-50 p-3 font-bold text-green-950 ring-1 ring-green-200">Profit: {money(revenue)} - {money(productCogs)} product COGS - {money(shippingUsedForProfit)} shipping = {money(profit)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-black">Monthly Rollup</h2>
            <div className="mt-5 overflow-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Reserve</th><th className="px-4 py-3">Actual Ship</th><th className="px-4 py-3">COGS</th><th className="px-4 py-3">Profit</th></tr></thead>
                <tbody>{monthly.length ? monthly.map((row) => <tr key={row.label} className="border-t border-neutral-200"><td className="px-4 py-3 font-bold">{row.label}</td><td className="px-4 py-3">{row.orders}</td><td className="px-4 py-3">{row.units}</td><td className="px-4 py-3">{money(row.revenue)}</td><td className="px-4 py-3">{money(row.reserve)}</td><td className="px-4 py-3">{money(row.actualShipping)}</td><td className="px-4 py-3">{money(row.cogs)}</td><td className="px-4 py-3 font-bold">{money(row.profit)}</td></tr>) : <tr><td className="px-4 py-5 text-neutral-500" colSpan={8}>No paid orders found for this period.</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-black">Recent Paid Orders</h2>
          <div className="mt-5 overflow-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Reserve</th><th className="px-4 py-3">Actual Ship</th><th className="px-4 py-3">COGS</th><th className="px-4 py-3">Profit</th></tr></thead>
              <tbody>{orders.slice(0, 50).map((order) => { const rowRevenue = orderAmount(order); const rowUnits = orderQuantity(order); const rowReserve = shippingReserve(order); const rowActualShipping = actualShippingCost(order); const rowShippingUsed = shippingCostForProfit(order); const rowCogs = rowUnits * COWSTOP_UNIT_COST + rowShippingUsed; return <tr key={clean(order.id) || `${customerName(order)}-${orderDate(order)}`} className="border-t border-neutral-200"><td className="px-4 py-3">{orderDate(order).slice(0, 10)}</td><td className="px-4 py-3 font-semibold">{customerName(order)}</td><td className="px-4 py-3">{rowUnits}</td><td className="px-4 py-3">{money(rowRevenue)}</td><td className="px-4 py-3">{money(rowReserve)}</td><td className="px-4 py-3">{rowActualShipping > 0 ? money(rowActualShipping) : "-"}</td><td className="px-4 py-3">{money(rowCogs)}</td><td className="px-4 py-3 font-bold">{money(rowRevenue - rowCogs)}</td></tr>; })}</tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-medium text-neutral-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p>{note ? <p className="mt-2 text-xs text-neutral-500">{note}</p> : null}</div>;
}
