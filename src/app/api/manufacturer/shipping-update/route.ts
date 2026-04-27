import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendDistributorShipmentNotification } from "@/lib/email/resend";
import type { ShipmentUpdatePayload } from "@/lib/email/templates/order-workflow";

type ShippingUpdateBody = {
  orderId?: string;
  orderReference?: string;
  shipDate?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
  estimatedDeliveryDate?: string;
  numberOfPallets?: string;
  freightClass?: string;
  bolNumber?: string;
  bolFile?: string;
  manufacturerNotes?: string;
  rawUpdate?: string;
};

type OrderRecord = {
  id: string;
  customer_id?: string | null;
  cowstop_quantity?: number | null;
  quantity?: number | null;
  raw_vendor_name?: string | null;
  normalized_vendor_name?: string | null;
  distributor_profile_id?: string | null;
  product_name?: string | null;
};

type CustomerRecord = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
};

type DistributorRecord = {
  company_name?: string | null;
  contact_email?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value: string) {
  return value || null;
}

async function findOrder(body: ShippingUpdateBody) {
  const supabase = createSupabaseAdminClient();
  const requestedId = clean(body.orderId || body.orderReference);

  if (!requestedId) throw new Error("Order ID or order reference is required.");

  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_id, cowstop_quantity, quantity, raw_vendor_name, normalized_vendor_name, distributor_profile_id, product_name")
    .eq("id", requestedId)
    .maybeSingle();

  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!data) throw new Error(`No order found for ${requestedId}.`);
  return data as OrderRecord;
}

async function findCustomer(customerId?: string | null) {
  if (!customerId) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("email, first_name, last_name, company")
    .eq("id", customerId)
    .maybeSingle();

  if (error) throw new Error(`Customer lookup failed: ${error.message}`);
  return (data ?? null) as CustomerRecord | null;
}

async function findDistributor(distributorProfileId?: string | null) {
  if (!distributorProfileId) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("distributor_profiles")
    .select("company_name, contact_email")
    .eq("id", distributorProfileId)
    .maybeSingle();

  if (error) throw new Error(`Distributor lookup failed: ${error.message}`);
  return (data ?? null) as DistributorRecord | null;
}

async function persistShippingUpdate(body: ShippingUpdateBody, order: OrderRecord) {
  const supabase = createSupabaseAdminClient();
  const update = {
    order_id: order.id,
    order_reference: clean(body.orderReference || body.orderId) || order.id,
    order_status: "shipped",
    ship_date: normalizeDate(clean(body.shipDate)),
    carrier: clean(body.carrier) || null,
    tracking_number: clean(body.trackingNumber) || null,
    tracking_link: clean(body.trackingLink) || null,
    estimated_delivery_date: normalizeDate(clean(body.estimatedDeliveryDate)),
    number_of_pallets: clean(body.numberOfPallets) || null,
    freight_class: clean(body.freightClass) || null,
    bol_number: clean(body.bolNumber) || null,
    bol_file: clean(body.bolFile) || null,
    manufacturer_notes: clean(body.manufacturerNotes) || null,
    raw_update: clean(body.rawUpdate) || null,
  };

  const { data, error } = await supabase
    .from("manufacturer_shipping_updates")
    .insert(update)
    .select("id")
    .single();

  if (error) throw new Error(`Shipping update create failed: ${error.message}`);

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      shipment_status: "shipped",
      ship_date: update.ship_date,
      carrier: update.carrier,
      tracking_number: update.tracking_number,
      tracking_link: update.tracking_link,
      expected_ship_date: update.estimated_delivery_date,
      estimated_delivery_date: update.estimated_delivery_date,
      number_of_pallets: update.number_of_pallets,
      freight_class: update.freight_class,
      bol_number: update.bol_number,
      bol_file: update.bol_file,
      manufacturer_notes: update.manufacturer_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (orderUpdateError) throw new Error(`Order shipping update failed: ${orderUpdateError.message}`);

  const { error: activityError } = await supabase.from("crm_activity").insert({
    activity_type: "shipping_update",
    title: `Manufacturer shipping update for order ${order.id}`,
    description: clean(body.rawUpdate) || clean(body.manufacturerNotes) || "Manufacturer shipping update received.",
    order_id: order.id,
    customer_id: order.customer_id ?? null,
    source: "manufacturer_shipping_update",
    status: "closed",
    metadata: { manufacturer_shipping_update_id: (data as { id: string }).id },
  });

  if (activityError) throw new Error(`CRM activity create failed: ${activityError.message}`);

  return String((data as { id: string }).id);
}

function buildShipmentEmailPayload(body: ShippingUpdateBody, order: OrderRecord, customer: CustomerRecord | null, distributor: DistributorRecord | null): ShipmentUpdatePayload | null {
  const distributorEmail = distributor?.contact_email || customer?.email;
  if (!distributorEmail) return null;

  const customerName = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ").trim() || customer?.company || undefined;

  return {
    orderId: order.id,
    distributorAccountName: distributor?.company_name || order.normalized_vendor_name || order.raw_vendor_name || customer?.company || "Cattle Guard Forms Customer",
    distributorEmail,
    customerName,
    customerEmail: customer?.email || undefined,
    quantity: order.cowstop_quantity || order.quantity || 1,
    shipDate: clean(body.shipDate),
    carrier: clean(body.carrier),
    trackingNumber: clean(body.trackingNumber),
    trackingLink: clean(body.trackingLink),
    estimatedDeliveryDate: clean(body.estimatedDeliveryDate),
    numberOfPallets: clean(body.numberOfPallets),
    freightClass: clean(body.freightClass),
    bolNumber: clean(body.bolNumber),
    manufacturerNotes: clean(body.manufacturerNotes),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShippingUpdateBody;
    const order = await findOrder(body);
    const customer = await findCustomer(order.customer_id);
    const distributor = await findDistributor(order.distributor_profile_id);
    const shippingUpdateId = await persistShippingUpdate(body, order);

    const emailPayload = buildShipmentEmailPayload(body, order, customer, distributor);
    let emailResult: unknown = null;
    if (emailPayload) {
      emailResult = await sendDistributorShipmentNotification(emailPayload);
    }

    return NextResponse.json({ ok: true, shippingUpdateId, orderId: order.id, emailSent: Boolean(emailPayload), emailResult });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Manufacturer shipping update failed." },
      { status: 500 }
    );
  }
}
