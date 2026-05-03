import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

type OrderMetric = {
  id: string;
  year: number;
  date: string;
  distributor: string;
  owner: string;
  title: string;
  source: string;
  product: string;
  quantity: number;
  revenue: number;
};

const currentYear = new Date().getFullYear();
const adChannels = ["Google Ads", "Facebook Marketplace", "Facebook Ads", "TikTok", "LinkedIn", "Email Campaigns"];

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
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}%`;
}

function orderDate(order: Row) {
  return clean(order.paid_at) || clean(order.created_at) || clean(order.updated_at) || new Date().toISOString();
}

function orderYear(order: Row) {
  const date = new Date(orderDate(order));
  return Number.isNaN(date.getTime()) ? currentYear : date.getFullYear();
}

function orderAmount(order: Row) {
  return numberValue(order.amount_display ?? order.amount_paid ?? order.total ?? order.order_total ?? order.price_total);
}

function orderQuantity(order: Row) {
  return numberValue(order.quantity_display ?? order.cowstop_quantity ?? order.quantity ?? order.forms_quantity ?? 0);
}

function isPaid(order: Row) {
  const payment = clean(order.payment_status).toLowerCase();
  const checkout = clean(order.checkout_status).toLowerCase();
  const status = clean(order.status).toLowerCase();
  return payment === "paid" || checkout === "paid" || checkout === "complete" || checkout === "succeeded" || status === "ready_for_fulfillment" || orderAmount(order) > 0;
}

function distributorName(order: Row) {
  return clean(order.normalized_vendor_name) || clean(order.raw_vendor_name) || clean(order.distributor_name) || clean(order.customer_name) || clean(order.company_name) || "Direct / Unassigned";
}

function ownerName(order: Row) {
  return clean(order.owner) || clean(order.sales_owner) || clean(order.assigned_to) || clean(order.created_by) || distributorName(order);
}

function sourceName(order: Row) {
  const raw = clean(order.utm_source) || clean(order.lead_source) || clean(order.source) || clean(order.campaign) || clean(order.referrer) || clean(order.checkout_source);
  return raw || "Unknown / direct";
}

function productName(order: Row) {
  return clean(order.product_name) || clean(order.product) || clean(order.sku) || "Cattle Guard Forms";
}

function normalizeOrder(order: Row): OrderMetric {
  const date = orderDate(order);
  return {
    id: clean(order.id),
    year: orderYear(order),
    date,
    distributor: distributorName(order),
    owner: ownerName(order),
    title: clean(order.title) || clean(order.order_title) || clean(order.bol_number) || clean(order.id).slice(0, 8) || "Order",
    source: sourceName(order),
    product: productName(order),
    quantity: orderQuantity(order),
    revenue: orderAmount(order),
  };
}

function groupBy<T extends string>(orders: OrderMetric[], key: (order: OrderMetric) => T) {
  const map = new Map<T, { label: T; orders: number; units: number; revenue: number }>();
  for (const order of orders) {
    const label = key(order);
    const existing = map.get(label) ?? { label, orders: 0, units: 0, revenue: 0 };
    existing.orders += 1;
    existing.units += order.quantity;
    existing.revenue += order.revenue;
    map.set(label, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

async function loadPaidOrders() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).filter(isPaid).map(normalizeOrder);
}

export default async function SalesAnalyticsPage({ searchParams }: { searchParams?: { year?: string; q?: string } }) {
  let orders: OrderMetric[] = [];
  let loadError = "";
  try {
    orders = await loadPaidOrders();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load orders.";
  }

  const years = Array.from(new Set([...orders.map((order) => order.year), currentYear])).sort((a, b) => b - a);
  const selectedYear = Number(searchParams?.year || currentYear);
  const q = (searchParams?.q || "").trim().toLowerCase();
  const filtered = orders.filter((order) => order.year === selectedYear).filter((order) => {
    if (!q) return true;
    return [order.distributor, order.owner, order.title, order.source, order.product, order.id].some((value) => value.toLowerCase().includes(q));
  });

  const yearly = groupBy(orders, (order) => String(order.year));
  const byDistributor = groupBy(filtered, (order) => order.distributor);
  const byProduct = groupBy(filtered, (order) => order.product);
  const bySource = groupBy(filtered, (order) => order.source);
  const totalRevenue = filtered.reduce((sum, order) => sum + order.revenue, 0);
  const totalOrders = filtered.length;
  const totalUnits = filtered.reduce((sum, order) => sum + order.quantity, 0);
  const adSpend = 0;
  const cac = totalOrders ? adSpend / totalOrders : 0;
  const roas = adSpend ? totalRevenue / adSpend : 0;
  const conversionValuePerOrder = totalOrders ? totalRevenue / totalOrders : 0;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="font-semibold text-green-800">Marketing Portal</Link>
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Home</Link>
            <Link href="/marketing/campaigns" className="hover:text-green-800">Campaigns</Link>
            <Link href="/marketing/contacts" className="hover:text-green-800">CRM Contacts</Link>
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Sales Analytics</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Sales, distributors, products, and marketing return.</h1>
          <p className="mt-4 max-w-4xl leading-7 text-neutral-700">
            This dashboard is read-only. It pulls from actual orders instead of making you create analytics records by hand. Use the search box for owner, title, distributor, source, product, or order ID.
          </p>
        </div>

        {loadError ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Sales analytics failed to load: {loadError}</div> : null}

        <form className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 md:grid-cols-[160px_1fr_auto]" action="/marketing/sales-analytics">
          <label className="grid gap-2 text-sm font-bold text-neutral-700">Year<select name="year" defaultValue={String(selectedYear)} className="rounded border border-neutral-300 px-3 py-2 font-normal">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">Search by owner, title, distributor, source, product, or order<input name="q" defaultValue={searchParams?.q || ""} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Search sales..." /></label>
          <button className="self-end rounded bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Apply</button>
        </form>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label={`${selectedYear} Sales`} value={money(totalRevenue)} />
          <Metric label="Orders Sold" value={String(totalOrders)} />
          <Metric label="Units / Forms Sold" value={String(totalUnits)} />
          <Metric label="Average Order Value" value={money(conversionValuePerOrder)} />
          <Metric label="Ad Spend Connected" value={money(adSpend)} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
          <Metric label="CAC" value={adSpend ? money(cac) : "Not connected"} note="Ad spend / orders sold" />
          <Metric label="ROAS" value={adSpend ? `${roas.toFixed(2)}x` : "Not connected"} note="Sales / ad spend" />
          <Metric label="Marketing Efficiency Ratio" value={adSpend ? `${(totalRevenue / adSpend).toFixed(2)}x` : "Not connected"} note="Revenue generated per ad dollar" />
          <Metric label="Ad Spend as % of Sales" value={adSpend ? percent((adSpend / totalRevenue) * 100) : "Not connected"} note="Ad spend / sales" />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <Table title="Yearly Sales" columns={["Year", "Orders", "Units", "Revenue"]} rows={yearly.map((row) => [row.label, row.orders, row.units, money(row.revenue)])} />
          <Table title="Yearly Sales by Distributor" columns={["Distributor", "Orders", "Units", "Revenue"]} rows={byDistributor.map((row) => [row.label, row.orders, row.units, money(row.revenue)])} />
          <Table title="Yearly Sales by Product / Cattle Guard Forms" columns={["Product", "Orders", "Units", "Revenue"]} rows={byProduct.map((row) => [row.label, row.orders, row.units, money(row.revenue)])} />
          <Table title="Sales by Source" columns={["Source", "Orders", "Units", "Revenue"]} rows={bySource.map((row) => [row.label, row.orders, row.units, money(row.revenue)])} />
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-black">Ad Spend vs Sales</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Ad spend is not connected yet, so this section does not ask you to create fake analytics records. Next step is to connect/import spend from campaign channels, then CAC, ROAS, MER, and ad-spend percentage calculate automatically.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {adChannels.map((channel) => <div key={channel} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="font-bold">{channel}</p><p className="mt-1 text-sm text-neutral-600">Spend: {money(0)} | Status: not connected</p></div>)}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-black">Recent Matching Orders</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Title / Order</th><th className="px-4 py-3">Distributor</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Revenue</th></tr></thead>
              <tbody>{filtered.slice(0, 50).map((order) => <tr key={order.id} className="border-t border-neutral-200"><td className="px-4 py-3">{order.date.slice(0, 10)}</td><td className="px-4 py-3 font-semibold">{order.title}</td><td className="px-4 py-3">{order.distributor}</td><td className="px-4 py-3">{order.owner}</td><td className="px-4 py-3">{order.source}</td><td className="px-4 py-3">{order.product}</td><td className="px-4 py-3">{order.quantity}</td><td className="px-4 py-3 font-bold">{money(order.revenue)}</td></tr>)}</tbody>
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

function Table({ title, columns, rows }: { title: string; columns: string[]; rows: Array<Array<string | number>> }) {
  return <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 overflow-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className="border-t border-neutral-200">{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-4 py-3">{cell}</td>)}</tr>) : <tr><td className="px-4 py-5 text-neutral-500" colSpan={columns.length}>No matching sales found.</td></tr>}</tbody></table></div></div>;
}
