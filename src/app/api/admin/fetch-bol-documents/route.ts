import { NextRequest, NextResponse } from "next/server";
import { getEchoAuthorizationHeader, getEchoConfig } from "@/lib/echo/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const MAX_ORDERS_PER_RUN = 10;

type DbRecord = Record<string, unknown>;
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
    .select("id")
    .eq("order_id", orderId)
    .in("file_type", ["echo_bol", "signed_bol", "original_bol", "bol"])
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

async function fetchAndStoreBol(supabase: ReturnType<typeof createSupabaseAdminClient>, order: DbRecord) {
  const orderId = clean(order.id);
  if (!orderId) return { ok: false, skipped: true, reason: "missing_order_id" };
  if (await hasBolFile(supabase, orderId)) return { ok: true, skipped: true, reason: "bol_file_already_exists", orderId };

  const shipmentId = extractEchoLoadId(order);
  if (!shipmentId) return { ok: false, skipped: true, reason: "missing_echo_load_id", orderId };

  const config = getEchoConfig();
  const documentsResponse = await fetch(`${config.baseUrl}/Shipments/${encodeURIComponent(shipmentId)}/Documents`, {
    headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/json" },
    cache: "no-store",
  });

  if (!documentsResponse.ok) {
    return { ok: false, orderId, shipmentId, reason: "echo_documents_lookup_failed", status: documentsResponse.status, statusText: documentsResponse.statusText, body: (await documentsResponse.text()).slice(0, 1000) };
  }

  const documentsJson = await documentsResponse.json();
  const bolDocument = findBolDocument(documentsJson);
  const href = documentHref(bolDocument);
  if (!href) return { ok: false, orderId, shipmentId, reason: "bol_document_not_available_yet", echoDocuments: documentsJson };

  const downloadResponse = await fetch(normalizeEchoHref(href, config.baseUrl), {
    headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,*/*" },
    cache: "no-store",
  });

  if (!downloadResponse.ok) {
    return { ok: false, orderId, shipmentId, reason: "echo_bol_download_failed", status: downloadResponse.status, statusText: downloadResponse.statusText, body: (await downloadResponse.text()).slice(0, 1000) };
  }

  const contentType = downloadResponse.headers.get("content-type") || "application/octet-stream";
  const bolNumber = clean(order.bol_number) || `Echo-BOL-${shipmentId}`;
  const filename = `${bolNumber}.${extensionFromContentType(contentType)}`;
  const storagePath = `${orderId}/echo_bol/${Date.now()}-${filename}`;
  const content = Buffer.from(await downloadResponse.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(ORDER_FILES_BUCKET).upload(storagePath, content, { contentType, upsert: false });
  if (uploadError) throw new Error(`BOL upload failed: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("order_files").insert({
    order_id: orderId,
    file_type: "echo_bol",
    file_name: filename,
    storage_path: storagePath,
    content_type: contentType,
    size_bytes: content.byteLength,
    uploaded_by_role: "system",
  });
  if (insertError) throw new Error(`BOL file metadata insert failed: ${insertError.message}`);

  await supabase.from("crm_activity").insert({
    activity_type: "bol_document",
    title: `BOL document stored for order ${orderId}`,
    description: `Fetched Echo BOL document ${filename} for Echo shipment/load ${shipmentId}.`,
    order_id: orderId,
    customer_id: clean(order.customer_id) || null,
    distributor_profile_id: clean(order.distributor_profile_id) || null,
    source: "echo_bol_fetch",
    status: "closed",
  });

  return { ok: true, orderId, shipmentId, filename, storagePath, sizeBytes: content.byteLength };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json().catch(() => ({}))) as FetchBolBody;
    const orderId = clean(body.orderId);
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
  return POST(request);
}
