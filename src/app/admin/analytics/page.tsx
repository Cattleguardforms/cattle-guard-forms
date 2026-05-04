import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type SearchParams = Promise<{ days?: string }>;
type AnalyticsEvent = { id: string; event_type: string; page_path: string; page_title: string | null; referrer: string | null; visitor_id: string | null; session_id: string | null; channel: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; created_at: string };

const channelLabels: Record<string, string> = { direct: "Direct", organic_search: "Organic Search", social: "Social", distributor_referral: "Distributor Referral", paid_campaign: "Paid Campaign", referral: "Referral" };
function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function money(value: number) { return value.toLocaleString("en-US", { style: "currency", currency: "USD" }); }
function pct(value: number) { return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%"; }
function startDate(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return date.toISOString(); }
function orderAmount(order: Row) { const value = Number(order.amount_display ?? order.amount_paid ?? order.total ?? 0); return Number.isFinite(value) ? value : 0; }
function isFakeOrTestOrder(order: Row) {
  const orderType = clean(order.order_type).toLowerCase();
  const customerEmail = clean(order.customer_email || order.contact_email || order.email).toLowerCase();
  const customerName = clean(order.customer_name || order.contact_name).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  const source = clean(order.source || order.checkout_source || order.lead_source).toLowerCase();

  return (
    orderType.includes("sandbox") ||
    orderType.includes("test") ||
    source.includes("sandbox") ||
    source.includes("test") ||
    sessionId.startsWith("cs_test_") ||
    customerEmail.includes("neroa.io") ||
    customerName.includes("thomas farrell")
  );
}
function isPaidLiveOrder(order: Row) {
  if (isFakeOrTestOrder(order)) return false;
  const payment = clean(order.payment_status).toLowerCase();
  const checkout = clean(order.checkout_status).toLowerCase();
  const status = clean(order.status).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  const hasLiveStripeSession = sessionId.startsWith("cs_live_");

  return payment === "paid" || checkout === "paid" || checkout === "complete" || checkout === "succeeded" || status === "ready_for_fulfillment" || hasLiveStripeSession;
}
function channelFromOrder(order: Row) { const source = clean(order.utm_source || order.source || order.lead_source || order.campaign || order.checkout_source).toLowerCase(); const medium = clean(order.utm_medium).toLowerCase(); if (source.includes("google") && (medium.includes("cpc") || medium.includes("paid"))) return "paid_campaign"; if (source.includes("facebook") || source.includes("instagram") || source.includes("tiktok") || source.includes("linkedin")) return medium.includes("paid") || medium.includes("cpc") ? "paid_campaign" : "social"; if (source.includes("distributor")) return "distributor_referral"; if (source.includes("organic") || source.includes("search")) return "organic_search"; if (source) return "referral"; return "direct"; }
async function loadAnalytics(days: number) { const supabase = createSupabaseAdminClient(); const since = startDate(days); const eventsResult = await supabase.from("site_analytics_events").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(5000); if (eventsResult.error) throw new Error(eventsResult.error.message); const ordersResult = await supabase.from("orders").select("*").gte("created_at", since).limit(1000); if (ordersResult.error) throw new Error(ordersResult.error.message); return { events: (eventsResult.data ?? []) as AnalyticsEvent[], orders: ((ordersResult.data ?? []) as Row[]).filter(isPaidLiveOrder) }; }
function groupChannels(events: AnalyticsEvent[], orders: Row[]) { const map = new Map<string, { channel: string; visits: number; sessions: Set<string>; visitors: Set<string>; conversions: number; revenue: number }>(); for (const channel of Object.keys(channelLabels)) map.set(channel, { channel, visits: 0, sessions: new Set(), visitors: new Set(), conversions: 0, revenue: 0 }); for (const event of events) { const channel = event.channel || "direct"; const row = map.get(channel) ?? { channel, visits: 0, sessions: new Set(), visitors: new Set(), conversions: 0, revenue: 0 }; row.visits += 1; if (event.session_id) row.sessions.add(event.session_id); if (event.visitor_id) row.visitors.add(event.visitor_id); map.set(channel, row); } for (const order of orders) { const channel = channelFromOrder(order); const row = map.get(channel) ?? { channel, visits: 0, sessions: new Set(), visitors: new Set(), conversions: 0, revenue: 0 }; row.conversions += 1; row.revenue += orderAmount(order); map.set(channel, row); } return Array.from(map.values()).map((row) => ({ channel: row.channel, visits: row.visits, sessions: row.sessions.size, visitors: row.visitors.size, conversions: row.conversions, revenue: row.revenue, conversionRate: row.sessions.size ? (row.conversions / row.sessions.size) * 100 : 0 })).sort((a, b) => b.visits - a.visits); }
function topPages(events: AnalyticsEvent[]) { const map = new Map<string, { page: string; views: number; sessions: Set<string> }>(); for (const event of events) { const page = event.page_path || "/"; const row = map.get(page) ?? { page, views: 0, sessions: new Set() }; row.views += 1; if (event.session_id) row.sessions.add(event.session_id); map.set(page, row); } return Array.from(map.values()).map((row) => ({ page: row.page, views: row.views, sessions: row.sessions.size })).sort((a, b) => b.views - a.views).slice(0, 20); }

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const days = Math.max(1, Math.min(Number(params.days || 30), 365));
  let events: AnalyticsEvent[] = [];
  let orders: Row[] = [];
  let error = "";
  try { const loaded = await loadAnalytics(days); events = loaded.events; orders = loaded.orders; } catch (err) { error = err instanceof Error ? err.message : "Unable to load live analytics."; }
  const channels = groupChannels(events, orders);
  const pages = topPages(events);
  const sessions = new Set(events.map((event) => event.session_id).filter(Boolean)).size;
  const visitors = new Set(events.map((event) => event.visitor_id).filter(Boolean)).size;
  const conversions = orders.length;
  const revenue = orders.reduce((sum, order) => sum + orderAmount(order), 0);
  const conversionRate = sessions ? (conversions / sessions) * 100 : 0;
  return <main className="min-h-screen bg-neutral-50 text-neutral-950"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link><nav className="flex flex-wrap gap-6 text-sm font-medium text-neutral-700"><Link href="/admin/orders" className="hover:text-green-800">Orders</Link><Link href="/marketing/sales-analytics" className="hover:text-green-800">Sales Analytics</Link><Link href="/marketing/campaigns" className="hover:text-green-800">Campaigns</Link><Link href="/marketing" className="hover:text-green-800">Marketing</Link></nav></div></header><section className="mx-auto max-w-7xl px-6 py-10"><div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-semibold uppercase tracking-wide text-green-800">Live Site Analytics</p><h1 className="mt-2 text-4xl font-black tracking-tight">Traffic, conversion rate, channels, and sales attribution.</h1><p className="mt-4 max-w-4xl leading-7 text-neutral-700">Tracks live page views from the website and compares traffic channels against real paid live orders. Test, sandbox, fake, unpaid, and pending orders are excluded from revenue.</p></div>{error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Analytics error: {error}. Run the site analytics Supabase migration if the table does not exist.</div> : null}<form action="/admin/analytics" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><label className="grid gap-2 text-sm font-bold text-neutral-700">Date range<select name="days" defaultValue={String(days)} className="rounded border border-neutral-300 px-3 py-2 font-normal"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 365 days</option></select></label><button className="rounded bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Apply</button></form><section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Page Views" value={String(events.length)} /><Metric label="Sessions" value={String(sessions)} /><Metric label="Visitors" value={String(visitors)} /><Metric label="Conversion Rate" value={pct(conversionRate)} /><Metric label="Revenue" value={money(revenue)} /></section><section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-2xl font-black">Channel Performance</h2><div className="mt-5 overflow-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Page Views</th><th className="px-4 py-3">Sessions</th><th className="px-4 py-3">Visitors</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Conversion Rate</th><th className="px-4 py-3">Revenue</th></tr></thead><tbody>{channels.map((row) => <tr key={row.channel} className="border-t border-neutral-200"><td className="px-4 py-3 font-bold">{channelLabels[row.channel] || row.channel}</td><td className="px-4 py-3">{row.visits}</td><td className="px-4 py-3">{row.sessions}</td><td className="px-4 py-3">{row.visitors}</td><td className="px-4 py-3">{row.conversions}</td><td className="px-4 py-3">{pct(row.conversionRate)}</td><td className="px-4 py-3 font-bold">{money(row.revenue)}</td></tr>)}</tbody></table></div></section><section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-2xl font-black">Top Pages</h2><div className="mt-5 overflow-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">Page</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Sessions</th></tr></thead><tbody>{pages.map((row) => <tr key={row.page} className="border-t border-neutral-200"><td className="px-4 py-3 font-semibold">{row.page}</td><td className="px-4 py-3">{row.views}</td><td className="px-4 py-3">{row.sessions}</td></tr>)}</tbody></table></div></div><div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-2xl font-black">What is live now</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700"><li className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Live page view tracking across the site.</li><li className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Channel detection for organic search, social, direct, distributor referral, paid campaign, and referral.</li><li className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Conversion rate based on real paid live orders divided by tracked sessions.</li><li className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">Revenue attribution excludes test, sandbox, fake, unpaid, and pending orders.</li></ul></div></section></section></main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-medium text-neutral-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
