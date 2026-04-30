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
  if (!hasAdminProfile && !APPROVED_ADMIN_EMAILS.has(email)) throw new Error("Admin role is required.");

  return supabase;
}

function isArchived(order: Record<string, unknown>) {
  return clean(order.shipment_status) === "archived" || clean(order.checkout_status) === "archived";
}

function orderStatus(order: Record<string, unknown>) {
  const shipment = clean(order.shipment_status);
  if (shipment) return shipment;
  return clean(order.payment_status) === "paid" ? "ready_for_fulfillment" : "pending_payment";
}

function customerDisplay(order: Record<string, unknown>) {
  return clean(order.normalized_vendor_name) || clean(order.raw_vendor_name) || clean(order.customer_name) || "Customer / Distributor";
}

function shipToDisplay(order: Record<string, unknown>) {
  return [
    clean(order.ship_to_name),
    clean(order.project_address_line1) || clean(order.ship_to_address),
    clean(order.project_city) || clean(order.ship_to_city),
    clean(order.project_state) || clean(order.ship_to_state),
    clean(order.project_postal_code) || clean(order.ship_to_zip),
  ]
    .filter(Boolean)
    .join(", ");
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);

    const { data: rows, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(`Manufacturer order lookup failed: ${error.message}`);

    const orders = ((rows ?? []) as Record<string, unknown>[])
      .filter((order) => !isArchived(order))
      .filter((order) => clean(order.payment_status) === "paid" || clean(order.checkout_status) === "paid" || clean(order.shipment_status) === "ready_for_fulfillment")
      .map((order) => {
        const quantity = Number(order.cowstop_quantity ?? order.quantity ?? 0);

        return {
          id: clean(order.id),
          shortId: clean(order.id).slice(0, 8),
          customer: customerDisplay(order),
          contactEmail: clean(order.customer_email) || clean(order.email),
          contactPhone: clean(order.contact_phone) || clean(order.customer_phone),
          quantity,
          quantityLabel: `${quantity || 0} CowStop form${quantity === 1 ? "" : "s"}`,
          shipTo: shipToDisplay(order) || "Ship-to address not set",
          status: orderStatus(order),
          paymentStatus: clean(order.payment_status),
          carrier: clean(order.carrier),
          bolNumber: clean(order.bol_number),
          trackingLink: clean(order.tracking_link),
          shipDate: clean(order.ship_date),
          estimatedDeliveryDate: clean(order.estimated_delivery_date),
          shipmentStatus: clean(order.shipment_status),
          manufacturerNotes: clean(order.manufacturer_notes),
          createdAt: clean(order.created_at),
        };
      });

    const summary = {
      readyForFulfillment: orders.filter((order) => ["ready_for_fulfillment", "pending"].includes(order.status)).length,
      echoBooked: orders.filter((order) => order.status === "echo_booked").length,
      readyToShip: orders.filter((order) => order.status === "ready_to_ship").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      total: orders.length,
    };

    return NextResponse.json({ ok: true, summary, orders });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load manufacturer orders." },
      { status: 401 },
    );
  }
}
