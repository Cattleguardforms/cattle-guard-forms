import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LooseRecord = Record<string, unknown>;

type FulfillmentUpdate = {
  shipment_status?: unknown;
  carrier?: unknown;
  tracking_link?: unknown;
  bol_number?: unknown;
  ship_date?: unknown;
  estimated_delivery_date?: unknown;
  number_of_pallets?: unknown;
  freight_class?: unknown;
  manufacturer_notes?: unknown;
  status?: unknown;
};

const SHIPMENT_STATUSES = new Set(["pending", "ready_for_fulfillment", "preparing", "ready_to_ship", "shipped", "delivered", "delayed", "cancelled"]);
const ORDER_STATUSES = new Set(["ready_for_fulfillment", "preparing", "ready_to_ship", "shipped", "delivered", "cancelled"]);
const ARCHIVE_CONFIRMATION = "ARCHIVE_OLD_ORDERS";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const text = clean(value);
  return text ? text : null;
}

function nullableDate(value: unknown) {
  const text = clean(value);
  return text ? text : null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error("Number fields must be valid positive numbers.");
  return numberValue;
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
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");

  return { supabase, adminEmail: email };
}

function isArchived(order: LooseRecord) {
  return clean(order.shipment_status) === "archived" || clean(order.checkout_status) === "archived";
}

function isFakeOrTestOrder(order: LooseRecord) {
  const orderType = clean(order.order_type).toLowerCase();
  const customerEmail = clean(order.customer_email || order.contact_email || order.email || order.order_contact_email).toLowerCase();
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

function isPaidOrReady(order: LooseRecord) {
  if (isFakeOrTestOrder(order)) return false;
  const paymentStatus = clean(order.payment_status).toLowerCase();
  const checkoutStatus = clean(order.checkout_status).toLowerCase();
  const status = clean(order.status).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();

  return (
    paymentStatus === "paid" ||
    checkoutStatus === "paid" ||
    checkoutStatus === "complete" ||
    checkoutStatus === "succeeded" ||
    status === "ready_for_fulfillment" ||
    sessionId.startsWith("cs_live_")
  );
}

function getCount(orders: LooseRecord[], predicate: (order: LooseRecord) => boolean) {
  return orders.filter(predicate).length;
}

function getAmount(order: LooseRecord) {
  return Number(order.amount_paid ?? order.total ?? 0) || 0;
}

function getQuantity(order: LooseRecord) {
  return Number(order.cowstop_quantity ?? order.quantity ?? 0) || 0;
}

function normalizeOrder(order: LooseRecord, customer: LooseRecord | null) {
  const firstName = clean(customer?.first_name);
  const lastName = clean(customer?.last_name);
  const customerName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    ...order,
    quantity_display: getQuantity(order),
    amount_display: getAmount(order),
    customer_display_name:
      clean(customer?.company) ||
      clean(customer?.company_name) ||
      customerName ||
      clean(order.customer_name) ||
      clean(order.raw_vendor_name) ||
      clean(order.normalized_vendor_name) ||
      "Customer / Distributor",
    customer_email: clean(customer?.email) || clean(order.order_contact_email) || clean(order.email) || clean(order.customer_email),
    customer_phone: clean(customer?.phone) || clean(order.contact_phone) || clean(order.customer_phone),
  };
}

async function loadOrders(supabase: ReturnType<typeof createSupabaseAdminClient>, options?: { includeArchived?: boolean; includeAll?: boolean }) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Orders lookup failed: ${error.message}`);

  const allRows = (orders ?? []) as LooseRecord[];
  const visibleRows = options?.includeArchived ? allRows : allRows.filter((order) => !isArchived(order));
  const rows = options?.includeAll ? visibleRows : visibleRows.filter(isPaidOrReady);
  const customerIds = Array.from(new Set(rows.map((order) => clean(order.customer_id)).filter(Boolean)));

  let customerById: Record<string, LooseRecord> = {};
  if (customerIds.length) {
    const { data: customers, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .in("id", customerIds);

    if (customerError) throw new Error(`Customer lookup for orders failed: ${customerError.message}`);
    if (customers) customerById = Object.fromEntries((customers as LooseRecord[]).map((customer) => [clean(customer.id), customer]));
  }

  const normalized = rows.map((order) => normalizeOrder(order, customerById[clean(order.customer_id)] ?? null));
  const visiblePaidOrReady = visibleRows.filter(isPaidOrReady);

  const summary = {
    paidOrders: visiblePaidOrReady.length,
    totalPaidRevenue: visiblePaidOrReady.reduce((sum, order) => sum + getAmount(order), 0),
    pendingFulfillment: getCount(visiblePaidOrReady, (order) => {
      const status = clean(order.shipment_status) || clean(order.status);
      return status === "pending" || status === "ready_for_fulfillment" || status === "";
    }),
    preparing: getCount(visiblePaidOrReady, (order) => clean(order.shipment_status) === "preparing" || clean(order.status) === "preparing"),
    shipped: getCount(visiblePaidOrReady, (order) => clean(order.shipment_status) === "shipped" || clean(order.status) === "shipped"),
    delivered: getCount(visiblePaidOrReady, (order) => clean(order.shipment_status) === "delivered" || clean(order.status) === "delivered"),
    archived: getCount(allRows, isArchived),
    visible: normalized.length,
  };

  return { summary, orders: normalized };
}

function sanitizeFulfillmentUpdates(input: FulfillmentUpdate) {
  const updates: LooseRecord = {};

  if (Object.prototype.hasOwnProperty.call(input, "shipment_status")) {
    const status = clean(input.shipment_status);
    if (status && !SHIPMENT_STATUSES.has(status)) throw new Error("Unsupported shipment status.");
    updates.shipment_status = status || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "status")) {
    const status = clean(input.status);
    if (status && !ORDER_STATUSES.has(status)) throw new Error("Unsupported order status.");
    updates.status = status || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "carrier")) updates.carrier = nullableText(input.carrier);
  if (Object.prototype.hasOwnProperty.call(input, "tracking_link")) updates.tracking_link = nullableText(input.tracking_link);
  if (Object.prototype.hasOwnProperty.call(input, "bol_number")) updates.bol_number = nullableText(input.bol_number);
  if (Object.prototype.hasOwnProperty.call(input, "ship_date")) updates.ship_date = nullableDate(input.ship_date);
  if (Object.prototype.hasOwnProperty.call(input, "estimated_delivery_date")) updates.estimated_delivery_date = nullableDate(input.estimated_delivery_date);
  if (Object.prototype.hasOwnProperty.call(input, "number_of_pallets")) updates.number_of_pallets = nullableNumber(input.number_of_pallets);
  if (Object.prototype.hasOwnProperty.call(input, "freight_class")) updates.freight_class = nullableNumber(input.freight_class);
  if (Object.prototype.hasOwnProperty.call(input, "manufacturer_notes")) updates.manufacturer_notes = nullableText(input.manufacturer_notes);

  if (!Object.keys(updates).length) throw new Error("No fulfillment fields were provided.");

  updates.updated_at = new Date().toISOString();
  return updates;
}

async function writeAdminAudit(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  adminEmail: string;
  title: string;
  description: string;
  orderId?: string | null;
}) {
  const { error } = await input.supabase.from("crm_activity").insert({
    activity_type: "admin_audit",
    title: input.title,
    description: `${input.description}\n\nAdmin: ${input.adminEmail}`,
    order_id: input.orderId ?? null,
    source: "admin_orders_api",
    status: "closed",
  });
  if (error) throw new Error(`Admin audit log failed: ${error.message}`);
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const includeAll = searchParams.get("scope") === "all";
    const payload = await loadOrders(supabase, { includeArchived, includeAll });
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load admin orders." },
      { status: 401 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, adminEmail } = await requireAdmin(request);
    const body = (await request.json()) as { orderId?: unknown; updates?: FulfillmentUpdate };
    const orderId = clean(body.orderId);
    if (!orderId) return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });

    const updates = sanitizeFulfillmentUpdates(body.updates ?? {});
    const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select("*").maybeSingle();

    if (error) throw new Error(`Fulfillment update failed: ${error.message}`);
    if (!data) throw new Error("Order was not found after update.");

    await writeAdminAudit({
      supabase,
      adminEmail,
      orderId,
      title: `Admin updated fulfillment for order ${orderId}`,
      description: `Fulfillment fields updated: ${Object.keys(updates).filter((key) => key !== "updated_at").join(", ")}`,
    });

    return NextResponse.json({ ok: true, order: normalizeOrder(data as LooseRecord, null) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to update fulfillment fields." },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, adminEmail } = await requireAdmin(request);
    const body = (await request.json()) as { action?: string; keepLatest?: number; confirm?: string };

    if (body.action !== "archive_old_orders") {
      return NextResponse.json({ ok: false, error: "Unsupported admin orders action." }, { status: 400 });
    }

    if (body.confirm !== ARCHIVE_CONFIRMATION) {
      return NextResponse.json({ ok: false, error: `Bulk archive requires confirm = ${ARCHIVE_CONFIRMATION}.` }, { status: 400 });
    }

    const keepLatest = Math.max(1, Math.min(Number(body.keepLatest ?? 4), 25));
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, shipment_status, checkout_status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(`Orders cleanup lookup failed: ${error.message}`);

    const visibleRows = ((orders ?? []) as LooseRecord[]).filter((order) => !isArchived(order));
    const archiveIds = visibleRows.slice(keepLatest).map((order) => clean(order.id)).filter(Boolean);

    if (archiveIds.length) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ shipment_status: "archived", updated_at: new Date().toISOString() })
        .in("id", archiveIds);

      if (updateError) throw new Error(`Order archive failed: ${updateError.message}`);
    }

    await writeAdminAudit({
      supabase,
      adminEmail,
      title: "Admin bulk archived old orders",
      description: `Archived ${archiveIds.length} order(s). Kept latest ${keepLatest}. Archived IDs: ${archiveIds.join(", ") || "none"}.`,
    });

    const payload = await loadOrders(supabase, { includeArchived: false, includeAll: false });
    return NextResponse.json({ ok: true, archivedCount: archiveIds.length, ...payload });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to archive old orders." },
      { status: 400 },
    );
  }
}
