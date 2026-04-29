import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const APPROVED_ADMIN_EMAILS = new Set(["orders@cattleguardforms.com", "support@cattleguardforms.com"]);

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

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);

  const hasAdminProfile = Boolean(profile && profile.role === "admin" && profile.status === "active");
  const isApprovedAdminEmail = APPROVED_ADMIN_EMAILS.has(email);

  if (!hasAdminProfile && !isApprovedAdminEmail) throw new Error("Admin role is required.");

  return supabase;
}

function getCount(orders: Record<string, unknown>[], predicate: (order: Record<string, unknown>) => boolean) {
  return orders.filter(predicate).length;
}

function isArchived(order: Record<string, unknown>) {
  return clean(order.shipment_status) === "archived" || clean(order.checkout_status) === "archived";
}

async function loadOrders(supabase: ReturnType<typeof createSupabaseAdminClient>, includeArchived = false) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Orders lookup failed: ${error.message}`);

  const allRows = (orders ?? []) as Record<string, unknown>[];
  const rows = includeArchived ? allRows : allRows.filter((order) => !isArchived(order));
  const customerIds = Array.from(new Set(rows.map((order) => clean(order.customer_id)).filter(Boolean)));

  let customerById: Record<string, Record<string, unknown>> = {};
  if (customerIds.length) {
    const { data: customers, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .in("id", customerIds);

    if (!customerError && customers) {
      customerById = Object.fromEntries((customers as Record<string, unknown>[]).map((customer) => [clean(customer.id), customer]));
    }
  }

  const normalized = rows.map((order) => {
    const customer = customerById[clean(order.customer_id)] ?? null;
    const firstName = clean(customer?.first_name);
    const lastName = clean(customer?.last_name);
    const customerName = [firstName, lastName].filter(Boolean).join(" ");

    return {
      ...order,
      customer_display_name:
        clean(customer?.company) || customerName || clean(order.raw_vendor_name) || clean(order.normalized_vendor_name) || "Customer / Distributor",
      customer_email: clean(customer?.email) || clean(order.order_contact_email) || clean(order.email),
      customer_phone: clean(customer?.phone) || clean(order.contact_phone),
    };
  });

  const summary = {
    activeOrders: normalized.length,
    paid: getCount(normalized, (order) => clean(order.payment_status) === "paid"),
    pendingManufacturer: getCount(normalized, (order) => clean(order.shipment_status) === "pending" || clean(order.shipment_status) === "ready_for_fulfillment"),
    readyToShip: getCount(normalized, (order) => clean(order.shipment_status) === "ready_to_ship" || clean(order.shipment_status) === "echo_booked"),
    archived: getCount(allRows, isArchived),
  };

  return { summary, orders: normalized };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const payload = await loadOrders(supabase, includeArchived);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load admin orders." },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as { action?: string; keepLatest?: number };

    if (body.action !== "archive_old_orders") {
      return NextResponse.json({ ok: false, error: "Unsupported admin orders action." }, { status: 400 });
    }

    const keepLatest = Math.max(1, Math.min(Number(body.keepLatest ?? 4), 25));
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, shipment_status, checkout_status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(`Orders cleanup lookup failed: ${error.message}`);

    const visibleRows = ((orders ?? []) as Record<string, unknown>[]).filter((order) => !isArchived(order));
    const archiveIds = visibleRows.slice(keepLatest).map((order) => clean(order.id)).filter(Boolean);

    if (archiveIds.length) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ shipment_status: "archived", updated_at: new Date().toISOString() })
        .in("id", archiveIds);

      if (updateError) throw new Error(`Order archive failed: ${updateError.message}`);
    }

    const payload = await loadOrders(supabase, false);
    return NextResponse.json({ ok: true, archivedCount: archiveIds.length, ...payload });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to archive old orders." },
      { status: 400 },
    );
  }
}
