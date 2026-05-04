import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

function isFakeOrTestOrder(order: Row) {
  const orderType = clean(order.order_type).toLowerCase();
  const customerEmail = clean(order.customer_email || order.contact_email || order.email || order.order_contact_email).toLowerCase();
  const customerName = clean(order.customer_name || order.contact_name).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  const source = clean(order.source || order.checkout_source || order.lead_source).toLowerCase();
  return orderType.includes("sandbox") || orderType.includes("test") || source.includes("sandbox") || source.includes("test") || sessionId.startsWith("cs_test_") || customerEmail.includes("neroa.io") || customerName.includes("thomas farrell");
}

function isPaidOrReady(order: Row) {
  if (isFakeOrTestOrder(order)) return false;
  const paymentStatus = clean(order.payment_status).toLowerCase();
  const checkoutStatus = clean(order.checkout_status).toLowerCase();
  const status = clean(order.status).toLowerCase();
  const sessionId = clean(order.stripe_checkout_session_id).toLowerCase();
  return paymentStatus === "paid" || checkoutStatus === "paid" || checkoutStatus === "complete" || checkoutStatus === "succeeded" || status === "ready_for_fulfillment" || sessionId.startsWith("cs_live_");
}

function isActiveFulfillment(order: Row) {
  const shipmentStatus = clean(order.shipment_status).toLowerCase();
  const checkoutStatus = clean(order.checkout_status).toLowerCase();
  return !["delivered", "cancelled", "archived"].includes(shipmentStatus) && checkoutStatus !== "archived";
}

function hasEchoBooking(order: Row) {
  return Boolean(clean(order.echo_load_id) || clean(order.echo_shipment_id) || clean(order.shipment_id) || clean(order.bol_number) || clean(order.carrier));
}

function hasBolFileMarker(order: Row) {
  return Boolean(clean(order.bol_file) || clean(order.bol_document_url) || clean(order.bol_storage_path));
}

function isBolOrderFile(file: Row) {
  const name = clean(file.file_name).toLowerCase();
  const type = clean(file.file_type).toLowerCase();
  const path = clean(file.storage_path).toLowerCase();
  return type.includes("bol") || name.includes("bol") || path.includes("bol");
}

function displayName(order: Row) {
  return clean(order.customer_name) || clean(order.warranty_customer_name) || clean(order.ship_to_name) || clean(order.raw_vendor_name) || clean(order.normalized_vendor_name) || "Customer / Distributor";
}

function amount(order: Row) {
  return Number(order.amount_paid ?? order.total ?? 0) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(`Orders lookup failed: ${error.message}`);

    const candidateOrders = ((orders ?? []) as Row[]).filter((order) => isPaidOrReady(order) && isActiveFulfillment(order));
    const orderIds = candidateOrders.map((order) => clean(order.id)).filter(Boolean);

    let bolOrderIds = new Set<string>();
    if (orderIds.length) {
      const { data: files, error: filesError } = await supabase
        .from("order_files")
        .select("order_id,file_type,file_name,storage_path")
        .in("order_id", orderIds);
      if (filesError) throw new Error(`Order file lookup failed: ${filesError.message}`);
      bolOrderIds = new Set(((files ?? []) as Row[]).filter(isBolOrderFile).map((file) => clean(file.order_id)).filter(Boolean));
    }

    const missingBolOrders = candidateOrders
      .filter((order) => !hasBolFileMarker(order) && !bolOrderIds.has(clean(order.id)))
      .map((order) => ({
        id: clean(order.id),
        order_type: clean(order.order_type) || "customer",
        customer_name: displayName(order),
        customer_email: clean(order.customer_email || order.order_contact_email || order.email),
        payment_status: clean(order.payment_status),
        checkout_status: clean(order.checkout_status),
        shipment_status: clean(order.shipment_status || order.status),
        carrier: clean(order.carrier || order.carrier_name),
        bol_number: clean(order.bol_number),
        echo_load_id: clean(order.echo_load_id || order.echo_shipment_id || order.shipment_id),
        has_echo_booking: hasEchoBooking(order),
        amount: amount(order),
        created_at: clean(order.created_at),
        updated_at: clean(order.updated_at),
        retry_reason: hasEchoBooking(order) ? "Echo booking exists but no BOL file is stored yet." : "No stored BOL and no Echo booking/load marker found.",
      }));

    return NextResponse.json({ ok: true, count: missingBolOrders.length, orders: missingBolOrders });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load BOL retry queue." }, { status: 400 });
  }
}
