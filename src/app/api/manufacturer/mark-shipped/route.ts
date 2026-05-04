import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FROM_EMAIL = "orders@cattleguardforms.com";
const REPLY_TO_EMAIL = "support@cattleguardforms.com";
const SUPPORT_EMAIL = "support@cattleguardforms.com";

type DbRecord = Record<string, unknown>;
type Body = { orderId?: unknown };

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function parseEmails(value: unknown) {
  return clean(value)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(isValidEmail);
}

function uniqueEmails(values: string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

function manufacturerEmails() {
  return parseEmails(process.env.MANUFACTURER_EMAILS);
}

function customerEmails(order: DbRecord, customer: DbRecord | null) {
  return uniqueEmails([
    ...parseEmails(order.customer_email),
    ...parseEmails(order.warranty_customer_email),
    ...parseEmails(order.order_contact_email),
    ...parseEmails(order.contact_email),
    ...parseEmails(customer?.email),
  ]);
}

function distributorEmails(order: DbRecord) {
  return uniqueEmails([
    ...parseEmails(order.distributor_contact_email),
    ...parseEmails(order.distributor_email),
    ...parseEmails(order.contact_email),
    ...parseEmails(order.order_contact_email),
  ]);
}

function orderLabel(order: DbRecord, orderId: string) {
  return clean(order.bol_number) || clean(order.order_number) || clean(order.po_number) || clean(order.distributor_po_number) || orderId.slice(0, 8);
}

function customerName(order: DbRecord, customer: DbRecord | null) {
  return clean(order.customer_name) || clean(order.warranty_customer_name) || clean(order.ship_to_name) || [clean(customer?.first_name), clean(customer?.last_name)].filter(Boolean).join(" ") || "Customer";
}

function shipTo(order: DbRecord) {
  return [
    clean(order.ship_to_name),
    clean(order.ship_to_address),
    clean(order.ship_to_address2) || clean(order.ship_to_address_2),
    `${clean(order.ship_to_city)}, ${clean(order.ship_to_state)} ${clean(order.ship_to_zip)}`.trim(),
  ].filter(Boolean).join("\n");
}

async function requireManufacturer(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) throw new Error("Missing manufacturer session token.");

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid manufacturer session.");

  const email = userData.user.email.toLowerCase();
  const allowed = manufacturerEmails();
  if (!allowed.includes(email)) throw new Error("Approved manufacturer access is required.");

  return { supabase, actorEmail: email };
}

async function getLinkedCustomer(supabase: ReturnType<typeof createSupabaseAdminClient>, order: DbRecord) {
  const customerId = clean(order.customer_id);
  if (!customerId) return null;
  const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (error) throw new Error(`Linked customer lookup failed: ${error.message}`);
  return (data ?? null) as DbRecord | null;
}

async function sendShipmentEmails(input: { order: DbRecord; customer: DbRecord | null; orderId: string; actorEmail: string }) {
  const resendApiKey = clean(process.env.RESEND_API_KEY);
  const customer = customerEmails(input.order, input.customer);
  const distributor = distributorEmails(input.order);
  const support = [SUPPORT_EMAIL];
  const recipients = { customer, distributor, support };
  if (!resendApiKey) return { ok: false, recipients, error: "RESEND_API_KEY is not configured." };

  const resend = new Resend(resendApiKey);
  const orderText = orderLabel(input.order, input.orderId);
  const carrier = clean(input.order.carrier) || clean(input.order.carrier_name) || "Carrier not provided";
  const bol = clean(input.order.bol_number) || "BOL not provided";
  const tracking = clean(input.order.tracking_link);
  const eta = clean(input.order.estimated_delivery_date);
  const common = [
    `Order: ${orderText}`,
    `Order ID: ${input.orderId}`,
    `Carrier: ${carrier}`,
    `BOL Number: ${bol}`,
    tracking ? `Tracking: ${tracking}` : "Tracking: Not provided",
    eta ? `Estimated delivery: ${eta}` : "Estimated delivery: Not provided",
    "",
    "Ship-To:",
    shipTo(input.order) || "Not provided",
  ].join("\n");

  const customerText = [
    `Hello ${customerName(input.order, input.customer)},`,
    "",
    "Your CowStop order has been marked shipped by the manufacturer.",
    "",
    common,
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].join("\n");

  const distributorText = [
    "Hello,",
    "",
    "A CowStop order connected to your distributor account has been marked shipped by the manufacturer.",
    "",
    common,
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].join("\n");

  const supportText = [
    "Support copy: manufacturer marked order shipped.",
    "",
    `Manufacturer user: ${input.actorEmail}`,
    "",
    common,
  ].join("\n");

  try {
    const sends = [];
    if (customer.length) sends.push(resend.emails.send({ from: FROM_EMAIL, to: customer, replyTo: REPLY_TO_EMAIL, subject: `Your CowStop order has shipped - ${orderText}`, text: customerText }));
    if (distributor.length) sends.push(resend.emails.send({ from: FROM_EMAIL, to: distributor, replyTo: REPLY_TO_EMAIL, subject: `CowStop order shipped - ${orderText}`, text: distributorText }));
    sends.push(resend.emails.send({ from: FROM_EMAIL, to: support, replyTo: REPLY_TO_EMAIL, subject: `Support Copy - Order Shipped - ${orderText}`, text: supportText }));
    await Promise.all(sends);
    return { ok: true, recipients };
  } catch (error) {
    return { ok: false, recipients, error: error instanceof Error ? error.message : "Unable to send shipped emails." };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const orderId = clean(body.orderId);
    if (!orderId) throw new Error("Missing orderId.");

    const { supabase, actorEmail } = await requireManufacturer(request);
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
    if (!order) throw new Error("Order not found.");

    const customer = await getLinkedCustomer(supabase, order as DbRecord);
    const now = new Date().toISOString();
    const emailResult = await sendShipmentEmails({ order: order as DbRecord, customer, orderId, actorEmail });

    const { error: updateError } = await supabase.from("orders").update({ shipment_status: "shipped", status: "shipped", ship_date: now, updated_at: now }).eq("id", orderId);
    if (updateError) throw new Error(`Order shipped update failed: ${updateError.message}`);

    await supabase.from("crm_activity").insert({
      activity_type: "order_shipped",
      title: `Order marked shipped by manufacturer`,
      description: `Manufacturer ${actorEmail} marked order ${orderId} shipped. Email notification: ${emailResult.ok ? "sent" : `failed - ${emailResult.error}`}`,
      order_id: orderId,
      customer_id: clean((order as DbRecord).customer_id) || null,
      distributor_profile_id: clean((order as DbRecord).distributor_profile_id) || null,
      source: "manufacturer_portal",
      status: "closed",
    });

    return NextResponse.json({ ok: true, orderId, emailNotification: emailResult });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to mark order shipped." }, { status: 400 });
  }
}
