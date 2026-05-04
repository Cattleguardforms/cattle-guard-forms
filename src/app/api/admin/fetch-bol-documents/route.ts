import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getEchoAuthorizationHeader, getEchoConfig } from "@/lib/echo/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const MAX_ORDERS_PER_RUN = 10;
const BOL_FILE_TYPE = "original_bol";
const FROM_EMAIL = "orders@cattleguardforms.com";
const REPLY_TO_EMAIL = "support@cattleguardforms.com";
const SUPPORT_EMAIL = "support@cattleguardforms.com";

type DbRecord = Record<string, unknown>;
type EchoAttempt = { path: string; status: number; statusText: string; contentType: string; bodyPreview: string };
type EchoDocument = { Href?: string; href?: string; Type?: string; type?: string; Description?: string; description?: string; FileName?: string; fileName?: string };
type FetchBolBody = { orderId?: unknown; limit?: unknown };

type StoredBolResult = {
  ok: true;
  orderId: string;
  shipmentId: string;
  filename: string;
  fileType: string;
  storagePath: string;
  sizeBytes: number;
  sourcePath: string;
  emailNotification?: { ok: boolean; recipients?: { manufacturer: string[]; customer: string[]; support: string[] }; error?: string };
};

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function automationSecrets() { return [process.env.CRON_SECRET, process.env.CGF_AUTOMATION_SECRET, process.env.STRIPE_WEBHOOK_SECRET].map(clean).filter(Boolean); }
function isInternalAutomation(request: NextRequest) { const expectedSecrets = automationSecrets(); const provided = request.headers.get("x-cgf-automation-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""; return Boolean(provided && expectedSecrets.includes(provided)); }
function tokenFrom(request: NextRequest) { const header = request.headers.get("authorization") || ""; return header.startsWith("Bearer ") ? header.slice(7).trim() : ""; }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function parseEmails(value: unknown) { return clean(value).split(",").map((email) => email.trim().toLowerCase()).filter(isValidEmail); }
function uniqueEmails(values: string[]) { return values.filter((value, index, list) => list.indexOf(value) === index); }
function orderLabel(order: DbRecord, orderId: string) { return clean(order.bol_number) || clean(order.order_number) || orderId.slice(0, 8); }
function customerName(order: DbRecord, customer: DbRecord | null) { return clean(order.customer_name) || clean(order.warranty_customer_name) || clean(order.ship_to_name) || clean(customer?.customer_name) || [clean(customer?.first_name), clean(customer?.last_name)].filter(Boolean).join(" ") || "Customer"; }
function quantity(order: DbRecord) { const value = Number(order.cowstop_quantity ?? order.quantity ?? 1); return Number.isFinite(value) && value > 0 ? value : 1; }
function manufacturerEmails() { return parseEmails(process.env.MANUFACTURER_EMAILS); }
function customerEmails(order: DbRecord, customer: DbRecord | null) { return uniqueEmails(parseEmails(order.customer_email).concat(parseEmails(order.warranty_customer_email), parseEmails(order.order_contact_email), parseEmails(customer?.email))); }
function supportEmails() { return uniqueEmails(parseEmails(SUPPORT_EMAIL)); }

async function getLinkedCustomer(supabase: ReturnType<typeof createSupabaseAdminClient>, order: DbRecord) {
  const customerId = clean(order.customer_id);
  if (!customerId) return null;
  const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (error) throw new Error(`Linked customer lookup failed: ${error.message}`);
  return (data ?? null) as DbRecord | null;
}

async function notifyBolStored(input: { order: DbRecord; customer: DbRecord | null; orderId: string; filename: string; content: Buffer; contentType: string }) {
  const resendApiKey = clean(process.env.RESEND_API_KEY);
  const manufacturer = manufacturerEmails();
  const customer = customerEmails(input.order, input.customer);
  const support = supportEmails();
  const recipients = { manufacturer, customer, support };
  if (!resendApiKey) return { ok: false, recipients, error: "RESEND_API_KEY is not configured." };
  const resend = new Resend(resendApiKey);
  const orderText = orderLabel(input.order, input.orderId);
  const shipTo = [clean(input.order.ship_to_name), clean(input.order.ship_to_address), clean(input.order.ship_to_address2), `${clean(input.order.ship_to_city)}, ${clean(input.order.ship_to_state)} ${clean(input.order.ship_to_zip)}`.trim()].filter(Boolean).join("\n");
  const attachment = { filename: input.filename, content: input.content, contentType: input.contentType };
  const manufacturerText = [
    "Hello,",
    "",
    "The Echo BOL has been fetched and stored for this CowStop order.",
    "",
    `Order ID: ${input.orderId}`,
    `BOL Number: ${clean(input.order.bol_number) || "Not provided"}`,
    `Carrier: ${clean(input.order.carrier) || clean(input.order.carrier_name) || "Not provided"}`,
    `Customer: ${customerName(input.order, input.customer)}`,
    `Quantity: ${quantity(input.order)} CowStop form(s)`,
    "",
    "Ship-To:",
    shipTo || "Not provided",
    "",
    "The BOL is attached for your records.",
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].join("\n");
  const customerText = [
    `Hello ${customerName(input.order, input.customer)},`,
    "",
    "Your CowStop BOL / freight document is now available.",
    "",
    `Order ID: ${input.orderId}`,
    `BOL Number: ${clean(input.order.bol_number) || "Not provided"}`,
    `Carrier: ${clean(input.order.carrier) || clean(input.order.carrier_name) || "Not provided"}`,
    "",
    "The BOL is attached for your records.",
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].join("\n");
  try {
    const sends = [];
    if (manufacturer.length) sends.push(resend.emails.send({ from: FROM_EMAIL, to: manufacturer, replyTo: REPLY_TO_EMAIL, subject: `Echo BOL Ready - ${orderText}`, text: manufacturerText, attachments: [attachment] }));
    if (customer.length) sends.push(resend.emails.send({ from: FROM_EMAIL, to: customer, replyTo: REPLY_TO_EMAIL, subject: `Your CowStop BOL is ready - ${orderText}`, text: customerText, attachments: [attachment] }));
    if (support.length) sends.push(resend.emails.send({ from: FROM_EMAIL, to: support, replyTo: REPLY_TO_EMAIL, subject: `Support Copy - Echo BOL Ready - ${orderText}`, text: ["Support copy of the fetched Echo BOL email.", "", manufacturerText].join("\n"), attachments: [attachment] }));
    if (sends.length === 0) return { ok: false, recipients, error: "No valid email recipients found." };
    await Promise.all(sends);
    return { ok: true, recipients };
  } catch (error) {
    return { ok: false, recipients, error: error instanceof Error ? error.message : "Unable to send BOL notification email." };
  }
}

async function requireBolFetchAccess(request: NextRequest, orderId: string) {
  const supabase = createSupabaseAdminClient();
  if (isInternalAutomation(request)) return supabase;
  const token = tokenFrom(request);
  if (!token) throw new Error("Missing signed-in session token.");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid signed-in session.");
  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase.from("app_profiles").select("role, status").eq("email", email).maybeSingle();
  if (profileError) throw new Error(`Role lookup failed: ${profileError.message}`);
  if (!profile || profile.status !== "active") throw new Error("Active portal access is required.");
  if (profile.role === "admin") return supabase;
  if (profile.role !== "distributor") throw new Error("Admin or approved distributor access is required.");
  if (!orderId) throw new Error("An order ID is required for distributor BOL recovery.");
  const { data: distributor, error: distributorError } = await supabase.from("distributor_profiles").select("id").eq("contact_email", email).eq("status", "active").limit(1).maybeSingle();
  if (distributorError) throw new Error(`Distributor account lookup failed: ${distributorError.message}`);
  if (!distributor?.id) throw new Error("Active distributor account is required.");
  const { data: order, error: orderError } = await supabase.from("orders").select("id").eq("id", orderId).eq("distributor_profile_id", clean(distributor.id)).limit(1).maybeSingle();
  if (orderError) throw new Error(`Distributor order access check failed: ${orderError.message}`);
  if (!order?.id) throw new Error("This order is not available to the signed-in distributor.");
  return supabase;
}

function extractEchoLoadId(order: DbRecord) { const direct = clean(order.echo_load_id) || clean(order.echo_shipment_id) || clean(order.shipment_id); if (direct) return direct; const notes = clean(order.manufacturer_notes); const match = notes.match(/Echo Load ID:\s*([A-Za-z0-9_-]+)/i) || notes.match(/ShipmentId[:\s]+([A-Za-z0-9_-]+)/i); return match?.[1] ? match[1] : ""; }
function candidatePaths(shipmentId: string) { const encoded = encodeURIComponent(shipmentId); return [`/Shipments/${encoded}/Documents`, `/Shipments/${encoded}/Documents/BOL`, `/Shipments/${encoded}/Documents/BillOfLading`, `/Shipments/LTL/${encoded}/Documents/BOL`, `/Shipments/LTL/${encoded}/BOL`, `/Documents/Shipments/${encoded}/BOL`, `/Documents/Shipment/${encoded}/BOL`, `/Documents/${encoded}/BOL`, `/Documents/${encoded}`]; }
async function readTextPreview(response: Response) { try { return (await response.text()).slice(0, 1200); } catch { return "Unable to read Echo response body."; } }
function isDocumentContentType(contentType: string) { const lower = contentType.toLowerCase(); return lower.includes("application/pdf") || lower.includes("image/jpeg") || lower.includes("image/jpg") || lower.includes("image/png") || lower.includes("application/octet-stream"); }
function findBolDocument(json: unknown) { if (!json || typeof json !== "object") return null; const record = json as Record<string, unknown>; const docs = Array.isArray(record.Documents) ? record.Documents : Array.isArray(record.documents) ? record.documents : []; return (docs as EchoDocument[]).find((doc) => { const type = clean(doc.Type || doc.type).toLowerCase(); const description = clean(doc.Description || doc.description).toLowerCase(); const fileName = clean(doc.FileName || doc.fileName).toLowerCase(); return type === "bol" || description.includes("bill of lading") || description.includes("bol") || fileName.includes("bol"); }) ?? null; }
function documentHref(doc: EchoDocument | null) { return doc ? clean(doc.Href || doc.href) : ""; }
function maybeBase64PdfFromJson(value: unknown): string { if (!value || typeof value !== "object") return ""; const record = value as Record<string, unknown>; for (const key of ["DocumentContent", "documentContent", "FileContent", "fileContent", "Content", "content", "Base64", "base64", "Pdf", "pdf"]) { const candidate = clean(record[key]); if (candidate.length > 100) return candidate; } for (const nested of Object.values(record)) { const found = maybeBase64PdfFromJson(nested); if (found) return found; } return ""; }
function normalizeEchoHref(href: string, baseUrl: string) { if (href.startsWith("http://") || href.startsWith("https://")) { const url = new URL(href); const base = new URL(baseUrl); url.protocol = base.protocol; url.host = base.host; return url.toString(); } return `${baseUrl}${href.startsWith("/") ? href : `/${href}`}`; }
function extensionFromContentType(contentType: string) { const lower = contentType.toLowerCase(); if (lower.includes("pdf")) return "pdf"; if (lower.includes("png")) return "png"; if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg"; return "bin"; }

async function hasBolFile(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string) {
  const { data, error } = await supabase.from("order_files").select("id,file_name,storage_path").eq("order_id", orderId).or(`file_type.in.(original_bol,signed_bol,shipping_document,other_order_attachment),storage_path.ilike.%/echo_bol/%,file_name.ilike.%BOL%`).limit(1).maybeSingle();
  if (error) throw new Error(`Order file lookup failed: ${error.message}`);
  return Boolean(data?.id);
}
async function getCandidateOrders(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string, limit: number) { if (orderId) { const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle(); if (error) throw new Error(`Order lookup failed: ${error.message}`); return data ? [data as DbRecord] : []; } const { data, error } = await supabase.from("orders").select("*").eq("shipment_status", "echo_booked").order("updated_at", { ascending: false }).limit(limit); if (error) throw new Error(`Echo-booked order lookup failed: ${error.message}`); return (data ?? []) as DbRecord[]; }
async function downloadEchoHref(href: string, config: ReturnType<typeof getEchoConfig>) { return fetch(normalizeEchoHref(href, config.baseUrl), { headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,application/json,*/*" }, cache: "no-store" }); }

async function storeBolContent(input: { supabase: ReturnType<typeof createSupabaseAdminClient>; order: DbRecord; orderId: string; shipmentId: string; content: Buffer; contentType: string; sourcePath: string }): Promise<StoredBolResult> {
  const customer = await getLinkedCustomer(input.supabase, input.order);
  const bolNumber = clean(input.order.bol_number) || `Echo-BOL-${input.shipmentId}`;
  const filename = `${bolNumber}.${extensionFromContentType(input.contentType)}`;
  const storagePath = `${input.orderId}/echo_bol/${Date.now()}-${filename}`;
  const { error: uploadError } = await input.supabase.storage.from(ORDER_FILES_BUCKET).upload(storagePath, input.content, { contentType: input.contentType, upsert: false });
  if (uploadError) throw new Error(`BOL upload failed: ${uploadError.message}`);
  const { error: insertError } = await input.supabase.from("order_files").insert({ order_id: input.orderId, file_type: BOL_FILE_TYPE, file_name: filename, storage_path: storagePath, content_type: input.contentType, size_bytes: input.content.byteLength, uploaded_by_role: "system" });
  if (insertError) throw new Error(`BOL file metadata insert failed: ${insertError.message}`);
  const emailNotification = await notifyBolStored({ order: input.order, customer, orderId: input.orderId, filename, content: input.content, contentType: input.contentType });
  await input.supabase.from("orders").update({ bol_file: `Echo BOL stored from ${input.sourcePath}`, updated_at: new Date().toISOString() }).eq("id", input.orderId);
  await input.supabase.from("crm_activity").insert({ activity_type: "bol_document", title: `BOL document stored for order ${input.orderId}`, description: `Fetched Echo BOL document ${filename} for Echo shipment/load ${input.shipmentId}. Source: ${input.sourcePath}. Email notification: ${emailNotification.ok ? "sent" : `failed - ${emailNotification.error}`}`, order_id: input.orderId, customer_id: clean(input.order.customer_id) || null, distributor_profile_id: clean(input.order.distributor_profile_id) || null, source: "echo_bol_fetch", status: "closed" });
  return { ok: true, orderId: input.orderId, shipmentId: input.shipmentId, filename, fileType: BOL_FILE_TYPE, storagePath, sizeBytes: input.content.byteLength, sourcePath: input.sourcePath, emailNotification };
}

async function fetchAndStoreBol(supabase: ReturnType<typeof createSupabaseAdminClient>, order: DbRecord) {
  const orderId = clean(order.id);
  if (!orderId) return { ok: false, skipped: true, reason: "missing_order_id" };
  if (await hasBolFile(supabase, orderId)) return { ok: true, skipped: true, reason: "bol_file_already_exists", orderId };
  const shipmentId = extractEchoLoadId(order);
  if (!shipmentId) return { ok: false, skipped: true, reason: "missing_echo_load_id", orderId };
  const config = getEchoConfig();
  const attempts: EchoAttempt[] = [];
  for (const path of candidatePaths(shipmentId)) {
    const response = await fetch(`${config.baseUrl}${path}`, { headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,application/json,*/*" }, cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (response.ok && isDocumentContentType(contentType)) { const content = Buffer.from(await response.arrayBuffer()); return storeBolContent({ supabase, order, orderId, shipmentId, content, contentType, sourcePath: path }); }
    if (response.ok && contentType.toLowerCase().includes("application/json")) {
      const json = await response.json();
      const href = documentHref(findBolDocument(json));
      if (href) { const documentResponse = await downloadEchoHref(href, config); const documentContentType = documentResponse.headers.get("content-type") || ""; if (documentResponse.ok && isDocumentContentType(documentContentType)) { const content = Buffer.from(await documentResponse.arrayBuffer()); return storeBolContent({ supabase, order, orderId, shipmentId, content, contentType: documentContentType, sourcePath: href }); } attempts.push({ path: href, status: documentResponse.status, statusText: documentResponse.statusText, contentType: documentContentType, bodyPreview: await readTextPreview(documentResponse) }); }
      const base64 = maybeBase64PdfFromJson(json);
      if (base64) { const content = Buffer.from(base64.replace(/^data:application\/pdf;base64,/, ""), "base64"); return storeBolContent({ supabase, order, orderId, shipmentId, content, contentType: "application/pdf", sourcePath: path }); }
      attempts.push({ path, status: response.status, statusText: response.statusText, contentType, bodyPreview: JSON.stringify(json).slice(0, 1200) });
      continue;
    }
    attempts.push({ path, status: response.status, statusText: response.statusText, contentType, bodyPreview: await readTextPreview(response) });
  }
  return { ok: false, orderId, shipmentId, reason: "bol_document_not_available_yet", attemptedPaths: attempts };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as FetchBolBody;
    const orderId = clean(body.orderId);
    const supabase = await requireBolFetchAccess(request, orderId);
    const rawLimit = Number(body.limit ?? MAX_ORDERS_PER_RUN);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_ORDERS_PER_RUN) : MAX_ORDERS_PER_RUN;
    const orders = await getCandidateOrders(supabase, orderId, limit);
    const results = [];
    for (const order of orders) results.push(await fetchAndStoreBol(supabase, order));
    return NextResponse.json({ ok: true, checked: orders.length, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to fetch BOL documents." }, { status: 400 });
  }
}

export async function GET(request: NextRequest) { const orderId = clean(request.nextUrl.searchParams.get("orderId")); const limit = clean(request.nextUrl.searchParams.get("limit")); return POST(new NextRequest(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ orderId, limit }) })); }
