import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

function isArchived(order: Record<string, unknown>) {
  return clean(order.shipment_status) === "archived" || clean(order.checkout_status) === "archived";
}

function orderStatus(order: Record<string, unknown>) {
  const shipment = clean(order.shipment_status);
  if (shipment) return shipment;
  const payment = clean(order.payment_status);
  if (payment === "paid") return "ready_for_fulfillment";
  return payment || "pending";
}

async function requireDistributor(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Distributor sign-in is required.");

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid distributor session.");

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status, company_name")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Distributor role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "distributor" || profile.status !== "active") {
    throw new Error("Approved distributor access is required.");
  }

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id, company_name, contact_email, status, price_per_unit")
    .or(`contact_email.eq.${email},email.eq.${email}`)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (distributorError) throw new Error(`Distributor account lookup failed: ${distributorError.message}`);
  if (!distributor) throw new Error("Active distributor account is required.");

  return { supabase, email, distributor };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, email, distributor } = await requireDistributor(request);
    const distributorId = clean(distributor.id);

    const { data: rows, error } = await supabase
      .from("orders")
      .select("*")
      .or(`distributor_profile_id.eq.${distributorId},order_contact_email.eq.${email}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(`Distributor orders lookup failed: ${error.message}`);

    const orders = ((rows ?? []) as Record<string, unknown>[])
      .filter((order) => !isArchived(order))
      .map((order) => {
        const quantity = Number(order.cowstop_quantity ?? order.quantity ?? 0);
        const shipTo = [
          clean(order.ship_to_name),
          clean(order.project_address_line1 || order.ship_to_address),
          clean(order.project_city || order.ship_to_city),
          clean(order.project_state || order.ship_to_state),
          clean(order.project_postal_code || order.ship_to_zip),
        ].filter(Boolean).join(", ");

        return {
          id: clean(order.id),
          shortId: clean(order.id).slice(0, 8),
          quantity,
          quantityLabel: `${quantity || 0} CowStop form${quantity === 1 ? "" : "s"}`,
          total: Number(order.total ?? order.amount_paid ?? 0),
          paymentStatus: clean(order.payment_status),
          checkoutStatus: clean(order.checkout_status),
          shipmentStatus: clean(order.shipment_status),
          status: orderStatus(order),
          shippingMethod: clean(order.shipping_method),
          selectedRate: clean(order.selected_rate),
          freightCharge: Number(order.freight_charge ?? 0),
          carrier: clean(order.carrier),
          bolNumber: clean(order.bol_number),
          trackingLink: clean(order.tracking_link),
          shipTo: shipTo || "Ship-to address not set",
          createdAt: clean(order.created_at),
        };
      });

    const summary = {
      total: orders.length,
      paid: orders.filter((order) => order.paymentStatus === "paid").length,
      pending: orders.filter((order) => ["pending", "pending_payment"].includes(order.status)).length,
      ready: orders.filter((order) => ["ready_for_fulfillment", "ready_to_ship", "echo_booked"].includes(order.status)).length,
    };

    return NextResponse.json({ ok: true, summary, orders });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load distributor orders." },
      { status: 401 },
    );
  }
}
