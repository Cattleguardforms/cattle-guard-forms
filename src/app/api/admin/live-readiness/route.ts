import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Check = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type Row = Record<string, unknown>;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

async function requireAdmin(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Missing admin session token.");
  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid admin session.");
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role,status")
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();
  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");
  return supabase;
}

function envCheck(name: string, label: string, options?: { secret?: boolean; warnOnly?: boolean }): Check {
  const value = clean(process.env[name]);
  const present = Boolean(value);
  return {
    key: name,
    label,
    status: present ? "pass" : options?.warnOnly ? "warn" : "fail",
    detail: present ? `${name} is configured${options?.secret ? "." : `: ${value}`}` : `${name} is missing.`,
  };
}

async function countRows(supabase: ReturnType<typeof createSupabaseAdminClient>, table: string) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

function isFakeOrTestOrder(order: Row) {
  const orderType = clean(order.order_type).toLowerCase();
  const customerEmail = clean(order.customer_email || order.contact_email || order.email || order.order_contact_email).toLowerCase();
  const customerName = clean(order.customer_name || order.contact_name).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  const source = clean(order.source || order.checkout_source || order.lead_source).toLowerCase();
  return orderType.includes("sandbox") || orderType.includes("test") || source.includes("sandbox") || source.includes("test") || sessionId.startsWith("cs_test_") || customerEmail.includes("neroa.io") || customerName.includes("thomas farrell");
}

function isPaidLiveOrder(order: Row) {
  if (isFakeOrTestOrder(order)) return false;
  const payment = clean(order.payment_status).toLowerCase();
  const checkout = clean(order.checkout_status).toLowerCase();
  const status = clean(order.status).toLowerCase();
  const session = clean(order.stripe_checkout_session_id).toLowerCase();
  return payment === "paid" || checkout === "paid" || checkout === "complete" || checkout === "succeeded" || status === "ready_for_fulfillment" || session.startsWith("cs_live_");
}

function hasBolMarker(order: Row) {
  return Boolean(clean(order.bol_file) || clean(order.bol_document_url) || clean(order.bol_storage_path));
}

function isActive(order: Row) {
  const shipment = clean(order.shipment_status).toLowerCase();
  const checkout = clean(order.checkout_status).toLowerCase();
  return !["delivered", "cancelled", "archived"].includes(shipment) && checkout !== "archived";
}

async function orderHealthChecks(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<Check[]> {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return [{ key: "orders_lookup", label: "Orders table", status: "fail", detail: error.message }];
  const orders = (data ?? []) as Row[];
  const fakeOrders = orders.filter(isFakeOrTestOrder).length;
  const paidLive = orders.filter(isPaidLiveOrder);
  const activePaid = paidLive.filter(isActive);
  const activeMissingBol = activePaid.filter((order) => !hasBolMarker(order)).length;

  return [
    { key: "fake_orders", label: "Fake/test orders", status: fakeOrders === 0 ? "pass" : "warn", detail: `${fakeOrders} fake/test order row(s) detected in latest 200 orders.` },
    { key: "paid_live_orders", label: "Paid live orders", status: "pass", detail: `${paidLive.length} paid/ready live order(s) detected in latest 200 orders.` },
    { key: "missing_bol", label: "Active paid orders missing BOL marker", status: activeMissingBol === 0 ? "pass" : "warn", detail: `${activeMissingBol} active paid order(s) may need BOL retry or upload.` },
  ];
}

async function tableChecks(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<Check[]> {
  const tables = ["orders", "customers", "order_files", "crm_activity", "distributor_profiles", "pricing_settings"];
  const checks: Check[] = [];
  for (const table of tables) {
    try {
      const count = await countRows(supabase, table);
      checks.push({ key: `table_${table}`, label: `Table: ${table}`, status: "pass", detail: `${count} row(s) accessible.` });
    } catch (error) {
      checks.push({ key: `table_${table}`, label: `Table: ${table}`, status: "fail", detail: error instanceof Error ? error.message : `Unable to access ${table}.` });
    }
  }
  return checks;
}

async function pricingCheck(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<Check> {
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("setting_value")
    .eq("setting_key", "customer_retail_unit_price")
    .maybeSingle();
  if (error) return { key: "customer_price", label: "Customer live price", status: "fail", detail: error.message };
  const value = Number((data as Row | null)?.setting_value ?? 0);
  const valid = Number.isFinite(value) && value > 0;
  return { key: "customer_price", label: "Customer live price", status: valid ? "pass" : "warn", detail: valid ? `Customer unit price is ${value}.` : "Customer unit price is missing; checkout will use fallback pricing." };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const checks: Check[] = [
      envCheck("NEXT_PUBLIC_SUPABASE_URL", "Supabase URL"),
      envCheck("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "Supabase publishable key", { secret: true, warnOnly: true }),
      envCheck("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key", { secret: true, warnOnly: true }),
      envCheck("SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key", { secret: true }),
      envCheck("STRIPE_SECRET_KEY", "Stripe secret key", { secret: true }),
      envCheck("STRIPE_WEBHOOK_SECRET", "Stripe webhook secret", { secret: true }),
      envCheck("RESEND_API_KEY", "Resend email key", { secret: true }),
      envCheck("MANUFACTURER_EMAILS", "Manufacturer recipient emails", { secret: true }),
      envCheck("ECHO_ACCOUNT_NUMBER", "Echo account number", { secret: true, warnOnly: true }),
      envCheck("ECHO_API_KEY", "Echo API key", { secret: true, warnOnly: true }),
      envCheck("OPENAI_API_KEY", "OpenAI key for admin content drafts", { secret: true, warnOnly: true }),
      await pricingCheck(supabase),
      ...(await tableChecks(supabase)),
      ...(await orderHealthChecks(supabase)),
    ];

    const totals = {
      pass: checks.filter((check) => check.status === "pass").length,
      warn: checks.filter((check) => check.status === "warn").length,
      fail: checks.filter((check) => check.status === "fail").length,
      total: checks.length,
    };
    const score = Math.round(((totals.pass + totals.warn * 0.5) / Math.max(totals.total, 1)) * 100);
    return NextResponse.json({ ok: true, score, totals, checks, checked_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to run site health checks." }, { status: 400 });
  }
}
