import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DbRecord = Record<string, unknown>;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function noteValue(notes: string, label: string) {
  const line = notes.split("\n").find((entry) => entry.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return line ? line.slice(line.indexOf(":") + 1).trim() : "";
}

function compact(value: string) {
  return clean(value).toLowerCase();
}

function isAuthorized(order: DbRecord, access: string) {
  const token = clean(access);
  if (!token) return false;

  const allowedTokens = [
    clean(order.stripe_checkout_session_id),
    clean(order.stripe_payment_intent_id),
  ].filter(Boolean);

  return allowedTokens.some((allowed) => compact(allowed) === compact(token));
}

function warrantyDetails(order: DbRecord) {
  const notes = clean(order.manufacturer_notes);
  return {
    customerName:
      clean(order.warranty_customer_name) ||
      noteValue(notes, "Name") ||
      clean(order.ship_to_name) ||
      clean(order.customer_display_name) ||
      clean(order.customer_name),
    customerEmail:
      clean(order.warranty_customer_email) ||
      noteValue(notes, "Email") ||
      clean(order.customer_email) ||
      clean(order.order_contact_email),
    customerPhone:
      clean(order.warranty_customer_phone) ||
      noteValue(notes, "Phone") ||
      clean(order.contact_phone),
  };
}

function shipToAddress(order: DbRecord) {
  return [
    clean(order.ship_to_address || order.project_address_line1),
    clean(order.ship_to_address_2 || order.project_address_line2),
    clean(order.ship_to_city || order.project_city),
    clean(order.ship_to_state || order.project_state),
    clean(order.ship_to_zip || order.project_postal_code),
  ].filter(Boolean).join(", ");
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = clean(url.searchParams.get("orderId"));
    const access = clean(url.searchParams.get("access"));
    if (!orderId) throw new Error("Order ID is required.");

    const supabase = createSupabaseAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw new Error(`Customer warranty lookup failed: ${error.message}`);
    if (!order) throw new Error("Order not found.");

    const orderRecord = order as DbRecord;
    if (!isAuthorized(orderRecord, access)) {
      throw new Error("This warranty paperwork link is invalid or expired. Please contact support@cattleguardforms.com for a fresh copy.");
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: clean(orderRecord.id),
        shortId: clean(orderRecord.id).slice(0, 8),
        productName: clean(orderRecord.product_name) || "CowStop Reusable Form",
        quantity: Number(orderRecord.cowstop_quantity ?? orderRecord.quantity ?? orderRecord.quantity_display ?? 0),
        createdAt: clean(orderRecord.created_at),
        paymentStatus: clean(orderRecord.payment_status),
        shipmentStatus: clean(orderRecord.shipment_status),
        bolNumber: clean(orderRecord.bol_number),
        carrier: clean(orderRecord.carrier),
        shipToName: clean(orderRecord.ship_to_name) || clean(orderRecord.customer_display_name),
        shipToAddress: shipToAddress(orderRecord),
      },
      warranty: warrantyDetails(orderRecord),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load warranty paperwork." },
      { status: 401 },
    );
  }
}
