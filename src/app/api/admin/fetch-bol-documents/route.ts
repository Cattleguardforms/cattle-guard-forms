import { NextRequest, NextResponse } from "next/server";
import { getEchoAuthorizationHeader, getEchoConfig } from "@/lib/echo/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const MAX_ORDERS_PER_RUN = 10;
const BOL_FILE_TYPE = "shipping_document";

type DbRecord = Record<string, unknown>;
type EchoAttempt = { path: string; status: number; statusText: string; contentType: string; bodyPreview: string };
type EchoDocument = { Href?: string; href?: string; Type?: string; type?: string; Description?: string; description?: string; FileName?: string; fileName?: string };

type FetchBolBody = {
  orderId?: unknown;
  limit?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function automationSecrets() {
  return [process.env.CRON_SECRET, process.env.CGF_AUTOMATION_SECRET, process.env.STRIPE_WEBHOOK_SECRET]
    .map(clean)
    .filter(Boolean);
}

function isInternalAutomation(request: NextRequest) {
  const expectedSecrets = automationSecrets();
  const provided = request.headers.get("x-cgf-automation-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return Boolean(provided && expectedSecrets.includes(provided));
}

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function requireBolFetchAccess(request: NextRequest, orderId: string) {
  const supabase = createSupabaseAdminClient();
  if (isInternalAutomation(request)) return supabase;

  const token = tokenFrom(request);
  if (!token) throw new Error("Missing signed-in session token.");

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid signed-in session.");

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Role lookup failed: ${profileError.message}`);
  if (!profile || profile.status !== "active") throw new Error("Active portal access is required.");

  if (profile.role === "admin") return supabase;

  if (profile.role !== "distributor") throw new Error("Admin or approved distributor access is required.");
  if (!orderId) throw new Error("An order ID is required for distributor BOL recovery.");

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id")
    .eq("contact_email", email)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (distributorError) throw new Error(`Distributor account lookup failed: ${distributorError.message}`);
  if (!distributor?.id) throw new Error("Active distributor account is required.");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("distributor_profile_id", clean(distributor.id))
    .limit(1)
    .maybeSingle();

  if (orderError) throw new Error(`Distributor order access check failed: ${orderError.message}`);
  if (!order?.id) throw new Error("This order is not available to the signed-in distributor.");

  return supabase;
}

function extractEchoLoadId(order: DbRecord) {
  const direct = clean(order.echo_load_id) || clean(order.echo_shipment_id) || clean(order.shipment_id);
  if (direct) return direct;
  const notes = clean(order.manufacturer_notes);
  const match = notes.match(/Echo Load ID:\s*([A-Za-z0-9_-]+)/i) || notes.match(/ShipmentId[:\s]+([A-Za-z0-9_-]+)/i);
  return match?.[1] ? match[1] : "";
}

function candidatePaths(shipmentId: string) {
  const encoded = encodeURIComponent(shipmentId);
  return [
    `/Shipments/${encoded}/Documents`,
    `/Shipments/${encoded}/Documents/BOL`,
    `/Shipments/${encoded}/Documents/BillOfLading`,
    `/Shipments/LTL/${encoded}/Documents/BOL`,
    `/Shipments/LTL/${encoded}/BOL`,
    `/Documents/Shipments/${encoded}/BOL`,
    `/Documents/Shipment/${encoded}/BOL`,
    `/Documents/${encoded}/BOL`,
    `/Documents/${encoded}`,
  ];
}

async function readTextPreview(response: Response) {
  try {
    return (await response.text()).slice(0, 1200);
  } catch {
    return "Unable to read Echo response body.";
  }
}

function isDocumentContentType(contentType: string) {
  const lower = contentType.toLowerCase();
  return lower.includes("application/pdf") || lower.includes("image/jpeg") || lower.includes("image/jpg") || lower.includes("image/png") || lower.includes("application/octet-stream");
}

function findBolDocument(json: unknown) {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  const docs = Array.isArray(record.Documents) ? record.Documents : Array.isArray(record.documents) ? record.documents : [];
  return (docs as EchoDocument[]).find((doc) => {
    const type = clean(doc.Type || doc.type).toLowerCase();
    const description = clean(doc.Description || doc.description).toLowerCase();
    const fileName = clean(doc.FileName || doc.fileName).toLowerCase();
    return type === "bol" || description.includes("bill of lading") || description.includes("bol") || fileName.includes("bol");
  }) ?? null;
}

function documentHref(doc: EchoDocument | null) {
  if (!doc) return "";
  return clean(doc.Href || doc.href);
}

function maybeBase64PdfFromJson(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["DocumentContent", "documentContent", "FileContent", "fileContent", "Content", "content", "Base64", "base64", "Pdf", "pdf"]) {
    const candidate = clean(record[key]);
    if (candidate.length > 100) return candidate;
  }
  for (const nested of Object.values(record)) {
    const found = maybeBase64PdfFromJson(nested);
    if (found) return found;
  }
  return "";
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

function extensionFromContentType(contentType: string) {
  const lower = contentType.toLowerCase();
  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("png")) return "png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  return "bin";
}

async function hasBolFile(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string) {
  const { data, error } = await supabase
    .from("order_files")
    .select("id,file_name,storage_path")
    .eq("order_id", orderId)
    .or(`file_type.in.(original_bol,signed_bol,shipping_document,other_order_attachment),storage_path.ilike.%/echo_bol/%,file_name.ilike.%BOL%`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Order file lookup failed: ${error.message}`);
  return Boolean(data?.id);
}

async function getCandidateOrders(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string, limit: number) {
  if (orderId) {
    const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (error) throw new Error(`Order lookup failed: ${error.message}`);
    return data ? [data as DbRecord] : [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("shipment_status", "echo_booked")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Echo-booked order lookup failed: ${error.message}`);
  return (data ?? []) as DbRecord[];
}

async function downloadEchoHref(href: string, config: ReturnType<typeof getEchoConfig>) {
  return fetch(normalizeEchoHref(href, config.baseUrl), {
    headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,application/json,*/*" },
    cache: "no-store",
  });
}

async function storeBolContent(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  order: DbRecord;
  orderId: string;
  shipmentId: string;
  content: Buffer;
  contentType: string;
  sourcePath: string;
}) {
  const bolNumber = clean(input.order.bol_number) || `Echo-BOL-${input.shipmentId}`;
  const filename = `${bolNumber}.${extensionFromContentType(input.contentType)}`;
  const storagePath = `${input.orderId}/echo_bol/${Date.now()}-${filename}`;

  const { error: uploadError } = await input.supabase.storage.from(ORDER_FILES_BUCKET).upload(storagePath, input.content, { contentType: input.contentType, upsert: false });
  if (uploadError) throw new Error(`BOL upload failed: ${uploadError.message}`);

  const { error: insertError } = await input.supabase.from("order_files").insert({
    order_id: input.orderId,
    file_type: BOL_FILE_TYPE,
    file_name: filename,
    storage_path: storagePath,
    content_type: input.contentType,
    size_bytes: input.content.byteLength,
    uploaded_by_role: "system",
  });
  if (insertError) throw new Error(`BOL file metadata insert failed: ${insertError.message}`);

  await input.supabase
    .from("orders")
    .update({ bol_file: `Echo BOL stored from ${input.sourcePath}`, updated_at: new Date().toISOString() })
    .eq("id", input.orderId);

  await input.supabase.from("crm_activity").insert({
    activity_type: "bol_document",
    title: `BOL document stored for order ${input.orderId}`,
    description: `Fetched Echo BOL document ${filename} for Echo shipment/load ${input.shipmentId}. Source: ${input.sourcePath}`,
    order_id: input.orderId,
    customer_id: clean(input.order.customer_id) || null,
    distributor_profile_id: clean(input.order.distributor_profile_id) || null,
    source: "echo_bol_fetch",
    status: "closed",
  });

  return { ok: true, orderId: input.orderId, shipmentId: input.shipmentId, filename, fileType: BOL_FILE_TYPE, storagePath, sizeBytes: input.content.byteLength, sourcePath: input.sourcePath };
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
    const response = await fetch(`${config.baseUrl}${path}`, {
      headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,application/json,*/*" },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";

    if (response.ok && isDocumentContentType(contentType)) {
      const content = Buffer.from(await response.arrayBuffer());
      return storeBolContent({ supabase, order, orderId, shipmentId, content, contentType, sourcePath: path });
    }

    if (response.ok && contentType.toLowerCase().includes("application/json")) {
      const json = await response.json();
      const href = documentHref(findBolDocument(json));
      if (href) {
        const documentResponse = await downloadEchoHref(href, config);
        const documentContentType = documentResponse.headers.get("content-type") || "";
        if (documentResponse.ok && isDocumentContentType(documentContentType)) {
          const content = Buffer.from(await documentResponse.arrayBuffer());
          return storeBolContent({ supabase, order, orderId, shipmentId, content, contentType: documentContentType, sourcePath: href });
        }
        attempts.push({ path: href, status: documentResponse.status, statusText: documentResponse.statusText, contentType: documentContentType, bodyPreview: await readTextPreview(documentResponse) });
      }

      const base64 = maybeBase64PdfFromJson(json);
      if (base64) {
        const content = Buffer.from(base64.replace(/^data:application\/pdf;base64,/, ""), "base64");
        return storeBolContent({ supabase, order, orderId, shipmentId, content, contentType: "application/pdf", sourcePath: path });
      }

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
    for (const order of orders) {
      results.push(await fetchAndStoreBol(supabase, order));
    }
    return NextResponse.json({ ok: true, checked: orders.length, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to fetch BOL documents." }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const orderId = clean(request.nextUrl.searchParams.get("orderId"));
  const limit = clean(request.nextUrl.searchParams.get("limit"));
  return POST(new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ orderId, limit }),
  }));
}
