import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const FROM_EMAIL = "orders@cattleguardforms.com";
const REPLY_TO_EMAIL = "support@cattleguardforms.com";
const SUPPORT_EMAIL = "support@cattleguardforms.com";

type Row = Record<string, unknown>;
type ResendBolBody = { orderId?: unknown; target?: unknown };

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function unique(values: string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
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
  const adminEmail = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role,status")
    .eq("email", adminEmail)
    .maybeSingle();
  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");
  return { supabase, adminEmail };
}

async function getCustomer(supabase: ReturnType<typeof createSupabaseAdminClient>, order: Row) {
  const customerId = clean(order.customer_id);
  if (!customerId) return null;
  const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (error) throw new Error(`Customer lookup failed: ${error.message}`);
  return (data ?? null) as Row | null;
}

function customerName(order: Row, customer: Row | null) {
  return clean(order.customer_name) || clean(order.warranty_customer_name) || clean(order.ship_to_name) || clean(customer?.customer_name) || [clean(customer?.first_name), clean(customer?.last_name)].filter(Boolean).join(" ") || "there";
}

function customerEmails(order: Row, customer: Row | null) {
  return unique([
    ...parseEmails(order.customer_email),
    ...parseEmails(order.warranty_customer_email),
    ...parseEmails(order.order_contact_email),
    ...parseEmails(order.email),
    ...parseEmails(customer?.email),
  ]);
}

function manufacturerEmails() {
  return parseEmails(process.env.MANUFACTURER_EMAILS);
}

function supportEmails() {
  return parseEmails(SUPPORT_EMAIL);
}

function orderLabel(order: Row, orderId: string) {
  return clean(order.bol_number) || clean(order.order_number) || orderId.slice(0, 8);
}

function shipTo(order: Row) {
  return [
    clean(order.ship_to_name),
    clean(order.ship_to_address),
    clean(order.ship_to_address2),
    `${clean(order.ship_to_city)}, ${clean(order.ship_to_state)} ${clean(order.ship_to_zip)}`.trim(),
  ].filter(Boolean).join("\n") || "Not provided";
}

function isBolFile(file: Row) {
  const name = clean(file.file_name).toLowerCase();
  const type = clean(file.file_type).toLowerCase();
  const path = clean(file.storage_path).toLowerCase();
  return type.includes("bol") || name.includes("bol") || path.includes("bol");
}

async function findBolFile(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string) {
  const { data, error } = await supabase
    .from("order_files")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Order file lookup failed: ${error.message}`);
  const file = ((data ?? []) as Row[]).find(isBolFile);
  if (!file) throw new Error("No stored BOL file found for this order. Fetch or upload a BOL first.");
  return file;
}

async function downloadStoredFile(supabase: ReturnType<typeof createSupabaseAdminClient>, file: Row) {
  const storagePath = clean(file.storage_path);
  if (!storagePath) throw new Error("Stored BOL file is missing a storage path.");
  const { data, error } = await supabase.storage.from(ORDER_FILES_BUCKET).download(storagePath);
  if (error) throw new Error(`Stored BOL download failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

function customerText(order: Row, customer: Row | null, orderId: string, fileName: string) {
  return [
    `Hello ${customerName(order, customer)},`,
    "",
    "Your CowStop BOL / freight document is attached for your records.",
    "",
    `Order ID: ${orderId}`,
    `BOL Number: ${clean(order.bol_number) || "Not provided"}`,
    `Carrier: ${clean(order.carrier) || clean(order.carrier_name) || "Not provided"}`,
    `BOL File: ${fileName}`,
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].join("\n");
}

function manufacturerText(order: Row, customer: Row | null, orderId: string, fileName: string) {
  return [
    "Hello,",
    "",
    "The stored CowStop BOL / freight document is attached for this order.",
    "",
    `Order ID: ${orderId}`,
    `BOL Number: ${clean(order.bol_number) || "Not provided"}`,
    `Carrier: ${clean(order.carrier) || clean(order.carrier_name) || "Not provided"}`,
    `Customer: ${customerName(order, customer)}`,
    `Quantity: ${Number(order.cowstop_quantity ?? order.quantity ?? 1) || 1} CowStop form(s)`,
    `BOL File: ${fileName}`,
    "",
    "Ship-To:",
    shipTo(order),
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, adminEmail } = await requireAdmin(request);
    const body = (await request.json()) as ResendBolBody;
    const orderId = clean(body.orderId);
    const target = clean(body.target || "all").toLowerCase();
    if (!orderId) throw new Error("Order ID is required.");
    if (!["all", "customer", "manufacturer", "support"].includes(target)) throw new Error("Unsupported resend target.");

    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
    if (!order) throw new Error("Order not found.");

    const customer = await getCustomer(supabase, order as Row);
    const file = await findBolFile(supabase, orderId);
    const fileName = clean(file.file_name) || "CowStop-BOL.pdf";
    const contentType = clean(file.content_type) || "application/octet-stream";
    const content = await downloadStoredFile(supabase, file);
    const resendApiKey = clean(process.env.RESEND_API_KEY);
    if (!resendApiKey) throw new Error("RESEND_API_KEY is required to resend BOL emails.");
    const resend = new Resend(resendApiKey);
    const attachment = { filename: fileName, content, contentType };

    const recipients = {
      customer: target === "all" || target === "customer" ? customerEmails(order as Row, customer) : [],
      manufacturer: target === "all" || target === "manufacturer" ? manufacturerEmails() : [],
      support: target === "all" || target === "support" ? supportEmails() : [],
    };

    const sends = [];
    const label = orderLabel(order as Row, orderId);
    if (recipients.customer.length) {
      sends.push(resend.emails.send({ from: FROM_EMAIL, to: recipients.customer, replyTo: REPLY_TO_EMAIL, subject: `Your CowStop BOL is ready - ${label}`, text: customerText(order as Row, customer, orderId, fileName), attachments: [attachment] }));
    }
    if (recipients.manufacturer.length) {
      sends.push(resend.emails.send({ from: FROM_EMAIL, to: recipients.manufacturer, replyTo: REPLY_TO_EMAIL, subject: `CowStop BOL Resent - ${label}`, text: manufacturerText(order as Row, customer, orderId, fileName), attachments: [attachment] }));
    }
    if (recipients.support.length) {
      sends.push(resend.emails.send({ from: FROM_EMAIL, to: recipients.support, replyTo: REPLY_TO_EMAIL, subject: `Support Copy - CowStop BOL Resent - ${label}`, text: manufacturerText(order as Row, customer, orderId, fileName), attachments: [attachment] }));
    }
    if (!sends.length) throw new Error("No valid recipients found for the selected resend target.");

    await Promise.all(sends);
    await supabase.from("crm_activity").insert({
      activity_type: "bol_email_resend",
      title: `BOL email resent for order ${orderId}`,
      description: `Admin ${adminEmail} resent stored BOL ${fileName}. Target: ${target}. Customer recipients: ${recipients.customer.join(", ") || "none"}. Manufacturer recipients: ${recipients.manufacturer.join(", ") || "none"}. Support recipients: ${recipients.support.join(", ") || "none"}.`,
      order_id: orderId,
      customer_id: clean((order as Row).customer_id) || null,
      distributor_profile_id: clean((order as Row).distributor_profile_id) || null,
      source: "admin_resend_bol_email",
      status: "closed",
    });

    return NextResponse.json({ ok: true, orderId, fileName, target, recipients });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to resend BOL email." }, { status: 400 });
  }
}
