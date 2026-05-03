import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getEchoAuthorizationHeader, getEchoConfig } from "@/lib/echo/client";
import { buildManufacturerFulfillmentTemplate, type OrderWorkflowPayload } from "@/lib/email/templates/order-workflow";
import { buildManufacturerUploadUrl } from "@/lib/manufacturer/upload-token";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DbRecord = Record<string, unknown>;
type EchoDocument = { Href?: string; href?: string; Type?: string; type?: string; Description?: string; description?: string };

type InternalDryRunEmailBody = {
  orderId?: unknown;
  internalDryRun?: boolean;
};

const TRANSACTIONAL_FROM_EMAIL = "orders@cattleguardforms.com";
const TRANSACTIONAL_REPLY_TO_EMAIL = "support@cattleguardforms.com";
const TRANSACTIONAL_SUPPORT_EMAIL = "support@cattleguardforms.com";
const TRANSACTIONAL_ORDERS_EMAIL = "orders@cattleguardforms.com";

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function tokenFrom(request: NextRequest) { const header = request.headers.get("authorization") || ""; return header.startsWith("Bearer ") ? header.slice(7).trim() : ""; }
function emails(value?: string) { return (value || "").split(",").map((email) => email.trim()).filter(isValidEmail); }
function num(value: unknown, fallback = 0) { const next = Number(value ?? fallback); return Number.isFinite(next) ? next : fallback; }
function noteValue(notes: string, label: string) { const line = notes.split("\n").find((entry) => entry.toLowerCase().startsWith(`${label.toLowerCase()}:`)); return line ? line.slice(line.indexOf(":") + 1).trim() : ""; }
function isInternalAutomation(request: NextRequest) { const expected = process.env.CGF_AUTOMATION_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ""; const provided = request.headers.get("x-cgf-automation-secret") || ""; return Boolean(expected && provided && provided === expected); }
function siteUrl() { return (process.env.NEXT_PUBLIC_SITE_URL || "https://cattleguardforms.com").replace(/\/$/, ""); }
function customerWarrantyUrl(order: DbRecord) {
  const orderId = clean(order.id);
  const access = clean(order.stripe_checkout_session_id) || clean(order.stripe_payment_intent_id);
  const query = access ? `?access=${encodeURIComponent(access)}` : "";
  return `${siteUrl()}/customer/orders/${orderId}/warranty${query}`;
}

async function requireAdmin(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (isInternalAutomation(request)) return supabase;

  const token = tokenFrom(request);
  if (!token) throw new Error("Missing admin session token.");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid admin session.");
  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase.from("app_profiles").select("role, status").eq("email", email).maybeSingle();
  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");
  return supabase;
}

function extractEchoLoadId(order: DbRecord) {
  const direct = clean(order.echo_load_id) || clean(order.echo_shipment_id) || clean(order.shipment_id);
  if (direct) return direct;
  const notes = clean(order.manufacturer_notes);
  const match = notes.match(/Echo Load ID:\s*([A-Za-z0-9_-]+)/i) || notes.match(/ShipmentId[:\s]+([A-Za-z0-9_-]+)/i);
  return match?.[1] ? match[1] : "";
}

function findBolHref(json: unknown) {
  if (!json || typeof json !== "object") return "";
  const record = json as Record<string, unknown>;
  const docs = Array.isArray(record.Documents) ? record.Documents : Array.isArray(record.documents) ? record.documents : [];
  const bol = (docs as EchoDocument[]).find((doc) => {
    const type = clean(doc.Type || doc.type).toLowerCase();
    const description = clean(doc.Description || doc.description).toLowerCase();
    return type === "bol" || description.includes("bill of lading") || description.includes("bol");
  });
  return clean(bol?.Href || bol?.href);
}

function normalizeEchoHref(href: string, baseUrl: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    const url = new URL(href);
    const base = new URL(baseUrl);
    url.protocol = base.protocol;
    url.host = base.host;
    return url.toString();
  }
  return `${baseUrl}${href.startsWith("/") ? href : `/${href}`}`;
}

async function fetchEchoBolAttachment(shipmentId: string, bolNumber: string) {
  const config = getEchoConfig();
  const documentsResponse = await fetch(`${config.baseUrl}/Shipments/${encodeURIComponent(shipmentId)}/Documents`, { headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/json" }, cache: "no-store" });
  if (!documentsResponse.ok) throw new Error(`Echo documents lookup failed: ${documentsResponse.status} ${documentsResponse.statusText}`);
  const href = findBolHref(await documentsResponse.json());
  if (!href) throw new Error("Echo did not return a BOL document href for this shipment.");
  const documentResponse = await fetch(normalizeEchoHref(href, config.baseUrl), { headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,*/*" }, cache: "no-store" });
  if (!documentResponse.ok) throw new Error(`Echo BOL download failed: ${documentResponse.status} ${documentResponse.statusText}`);
  const contentType = documentResponse.headers.get("content-type") || "application/octet-stream";
  const lower = contentType.toLowerCase();
  const extension = lower.includes("pdf") ? "pdf" : lower.includes("png") ? "png" : lower.includes("jpeg") || lower.includes("jpg") ? "jpg" : "bin";
  return { filename: `${bolNumber || `Echo-BOL-${shipmentId}`}.${extension}`, content: Buffer.from(await documentResponse.arrayBuffer()), contentType };
}

function buildOrderPayload(order: DbRecord, attachmentName: string): OrderWorkflowPayload {
  const notes = clean(order.manufacturer_notes);
  return {
    orderId: clean(order.id),
    distributorAccountName: clean(order.normalized_vendor_name) || clean(order.raw_vendor_name) || clean(order.customer_display_name) || "Cattle Guard Forms Customer",
    distributorEmail: clean(order.order_contact_email) || clean(order.customer_email) || clean(order.distributor_email) || TRANSACTIONAL_ORDERS_EMAIL,
    customerName: noteValue(notes, "Name") || clean(order.ship_to_name) || clean(order.customer_display_name),
    customerEmail: noteValue(notes, "Email") || clean(order.customer_email),
    quantity: num(order.cowstop_quantity ?? order.quantity ?? order.quantity_display, 1),
    orderDate: new Date().toLocaleDateString("en-US"),
    shippingMethod: "echo",
    shipToName: clean(order.ship_to_name),
    shipToAddress: clean(order.ship_to_address || order.project_address_line1),
    shipToAddress2: clean(order.ship_to_address_2 || order.project_address_line2),
    shipToCity: clean(order.ship_to_city || order.project_city),
    shipToState: clean(order.ship_to_state || order.project_state),
    shipToZip: clean(order.ship_to_zip || order.project_postal_code),
    selectedRate: clean(order.selected_rate) || clean(order.carrier),
    bolFileName: attachmentName,
    orderNotes: [clean(order.bol_number) ? `BOL Number: ${clean(order.bol_number)}` : null, extractEchoLoadId(order) ? `Echo Load ID: ${extractEchoLoadId(order)}` : null, notes].filter(Boolean).join("\n"),
    stripeSessionId: clean(order.stripe_checkout_session_id),
  };
}

function customerEmailFromOrder(order: DbRecord) {
  const notes = clean(order.manufacturer_notes);
  const candidates = [
    noteValue(notes, "Email"),
    clean(order.warranty_customer_email),
    clean(order.customer_email),
    clean(order.order_contact_email),
  ];
  return candidates.find(isValidEmail) || "";
}

function customerNameFromOrder(order: DbRecord) {
  const notes = clean(order.manufacturer_notes);
  return noteValue(notes, "Name") || clean(order.warranty_customer_name) || clean(order.ship_to_name) || clean(order.customer_display_name) || "there";
}

function buildCustomerBolEmailText(order: DbRecord, bolFileName: string) {
  const orderId = clean(order.id);
  const notes = clean(order.manufacturer_notes);
  const bolNumber = clean(order.bol_number) || noteValue(notes, "BOL Number") || "Attached";
  return [
    `Hello ${customerNameFromOrder(order)},`,
    "",
    "Your CowStop order freight paperwork is ready.",
    "",
    `Order ID: ${orderId}`,
    `BOL Number: ${bolNumber}`,
    `BOL File: ${bolFileName}`,
    "",
    "The bill of lading is attached to this email. Please keep it with your order paperwork.",
    "",
    "Customer warranty paperwork:",
    customerWarrantyUrl(order),
    "",
    "If anything looks incorrect, reply to this email or contact support@cattleguardforms.com.",
    "",
    "Thank you,",
    "",
    "Cattle Guard Forms",
  ].join("\n");
}

function buildInternalOrderPaperworkText(order: DbRecord) {
  const notes = clean(order.manufacturer_notes);
  const orderId = clean(order.id);
  const customerName = noteValue(notes, "Name") || clean(order.ship_to_name) || clean(order.customer_display_name) || "Customer";
  const customerEmail = noteValue(notes, "Email") || clean(order.customer_email) || "Not provided";
  const customerPhone = noteValue(notes, "Phone") || clean(order.contact_phone) || "Not provided";
  const bolNumber = clean(order.bol_number) || "Not assigned yet";

  return [
    "Hello,",
    "",
    "A CowStop order has been placed and the customer paperwork is ready for review.",
    "",
    `Order ID: ${orderId}`,
    `BOL Number: ${bolNumber}`,
    `Customer Name: ${customerName}`,
    `Customer Email: ${customerEmail}`,
    `Customer Phone: ${customerPhone}`,
    `Quantity: ${num(order.cowstop_quantity ?? order.quantity ?? order.quantity_display, 1)} CowStop form(s)`,
    "",
    "Customer warranty paperwork:",
    customerWarrantyUrl(order),
    "",
    "Please keep this warranty paperwork with the order record and provide the customer-facing packet as needed.",
    "",
    "Thank you for your continued support and partnership.",
    "",
    "Cattle Guard Forms",
  ].join("\n");
}

function appendManufacturerUploadInstructions(text: string, orderId: string, uploadUrl: string) {
  return [
    text,
    "",
    "---",
    "BOL UPLOAD LINK",
    "When the BOL is ready, upload it directly to this order here:",
    uploadUrl,
    "",
    "Uploading the BOL will automatically store it on the order and send the shipped/BOL email to the customer or distributor and support.",
    `Order ID: ${orderId}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as InternalDryRunEmailBody;
    const orderId = clean(body.orderId);
    if (!orderId) throw new Error("Order ID is required.");
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
    if (!order) throw new Error("Order not found.");
    const orderRecord = order as DbRecord;
    const shipmentId = extractEchoLoadId(orderRecord);
    if (!shipmentId) throw new Error("Echo shipment/load ID was not found on this order. Book the shipment before emailing.");

    const uploadUrl = buildManufacturerUploadUrl(orderId);
    const bolAttachment = await fetchEchoBolAttachment(shipmentId, clean(orderRecord.bol_number));
    const manufacturerTemplate = buildManufacturerFulfillmentTemplate(buildOrderPayload(orderRecord, bolAttachment.filename));
    const resendApiKey = clean(process.env.RESEND_API_KEY);
    if (!resendApiKey) throw new Error("RESEND_API_KEY is required to send email.");
    const resend = new Resend(resendApiKey);

    const supportEmail = TRANSACTIONAL_SUPPORT_EMAIL;
    const ordersEmail = TRANSACTIONAL_ORDERS_EMAIL;
    const from = TRANSACTIONAL_FROM_EMAIL;
    const replyTo = TRANSACTIONAL_REPLY_TO_EMAIL;
    const manufacturerRecipients = body.internalDryRun ? [supportEmail] : emails(process.env.MANUFACTURER_EMAILS);
    if (manufacturerRecipients.length === 0) throw new Error("MANUFACTURER_EMAILS must include at least one valid recipient.");

    const manufacturerResult = await resend.emails.send({
      from,
      to: manufacturerRecipients,
      replyTo,
      subject: body.internalDryRun ? `[INTERNAL TEST] ${manufacturerTemplate.subject}` : manufacturerTemplate.subject,
      text: body.internalDryRun ? [`INTERNAL TEST ONLY - this is the manufacturer email preview.`, "", appendManufacturerUploadInstructions(manufacturerTemplate.text, orderId, uploadUrl)].join("\n") : appendManufacturerUploadInstructions(manufacturerTemplate.text, orderId, uploadUrl),
      attachments: [{ filename: bolAttachment.filename, content: bolAttachment.content, contentType: bolAttachment.contentType }],
    });

    let internalPaperworkResult: unknown = null;
    let customerBolResult: unknown = null;
    const customerEmail = customerEmailFromOrder(orderRecord);

    if (body.internalDryRun) {
      internalPaperworkResult = await resend.emails.send({
        from,
        to: ordersEmail,
        replyTo,
        subject: `[INTERNAL TEST] CowStop order paperwork ready - ${orderId}`,
        text: buildInternalOrderPaperworkText(orderRecord),
      });

      if (customerEmail) {
        customerBolResult = await resend.emails.send({
          from,
          to: customerEmail,
          replyTo,
          subject: `Your CowStop BOL and warranty paperwork - ${orderId}`,
          text: buildCustomerBolEmailText(orderRecord, bolAttachment.filename),
          attachments: [{ filename: bolAttachment.filename, content: bolAttachment.content, contentType: bolAttachment.contentType }],
        });
      }
    }

    const previousNotes = clean(orderRecord.manufacturer_notes);
    const customerNote = customerEmail ? `Customer BOL email sent to ${customerEmail}` : "Customer BOL email skipped: no customer email found";
    const note = body.internalDryRun ? `Internal dry run emails sent: ${new Date().toISOString()} with ${bolAttachment.filename}; upload link generated; ${customerNote}` : `Manufacturer email sent: ${new Date().toISOString()} with ${bolAttachment.filename}; upload link generated`;
    await supabase.from("orders").update({ manufacturer_notes: [previousNotes, note].filter(Boolean).join("\n"), updated_at: new Date().toISOString() }).eq("id", orderId);
    return NextResponse.json({ ok: true, internalDryRun: Boolean(body.internalDryRun), orderId, shipmentId, bolFileName: bolAttachment.filename, manufacturerUploadUrl: uploadUrl, recipients: { manufacturerPreview: manufacturerRecipients, paperwork: body.internalDryRun ? [ordersEmail] : [], customerBol: customerEmail ? [customerEmail] : [] }, manufacturerResult, internalPaperworkResult, customerBolResult });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to send manufacturer order email." }, { status: 400 });
  }
}
