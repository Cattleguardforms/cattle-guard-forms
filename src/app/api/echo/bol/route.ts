import { NextRequest, NextResponse } from "next/server";
import { getEchoAuthorizationHeader, getEchoConfig } from "@/lib/echo/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DbRecord = Record<string, unknown>;
type EchoAttempt = { path: string; status: number; statusText: string; contentType: string; bodyPreview: string };

type EchoDocument = {
  Id?: number | string;
  Href?: string;
  href?: string;
  Type?: string;
  type?: string;
  Description?: string;
  description?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function requireAdmin(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) throw new Error("Missing admin session token.");
  const supabase = createSupabaseAdminClient();
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
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    const url = new URL(href);
    const base = new URL(baseUrl);
    url.protocol = base.protocol;
    url.host = base.host;
    return url.toString();
  }
  return `${baseUrl}${href.startsWith("/") ? href : `/${href}`}`;
}

async function updateOrderBolAvailable(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string, shipmentId: string, bolNumber: string, bolFile: string) {
  const { error } = await supabase
    .from("orders")
    .update({ bol_file: bolFile || `Echo BOL available for shipment ${shipmentId}`, bol_number: bolNumber || null, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) console.warn("Unable to update order BOL availability", error.message);
}

async function returnDocumentResponse(input: { response: Response; filename: string; sourcePath: string; supabase: ReturnType<typeof createSupabaseAdminClient>; orderId: string; shipmentId: string; bolNumber: string }) {
  const contentType = input.response.headers.get("content-type") || "application/octet-stream";
  const bytes = await input.response.arrayBuffer();
  const extension = contentType.toLowerCase().includes("jpeg") || contentType.toLowerCase().includes("jpg") ? "jpg" : contentType.toLowerCase().includes("png") ? "png" : contentType.toLowerCase().includes("pdf") ? "pdf" : "bin";
  const filename = input.filename.includes(".") ? input.filename : `${input.filename}.${extension}`;
  await updateOrderBolAvailable(input.supabase, input.orderId, input.shipmentId, input.bolNumber, `Echo BOL downloaded from ${input.sourcePath}`);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Echo-BOL-Path": input.sourcePath,
    },
  });
}

async function fetchEchoDocument(href: string, config: ReturnType<typeof getEchoConfig>) {
  return fetch(normalizeEchoHref(href, config.baseUrl), {
    method: "GET",
    headers: {
      Authorization: getEchoAuthorizationHeader(config),
      Accept: "application/pdf,image/jpeg,image/png,application/json,*/*",
    },
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as { orderId?: unknown; shipmentId?: unknown };
    const orderId = clean(body.orderId);
    if (!orderId) throw new Error("Order ID is required.");

    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
    if (!order) throw new Error("Order not found.");

    const orderRecord = order as DbRecord;
    const shipmentId = clean(body.shipmentId) || extractEchoLoadId(orderRecord);
    if (!shipmentId) throw new Error("Echo shipment/load ID was not found on this order. Book the shipment first.");

    const config = getEchoConfig();
    const attempts: EchoAttempt[] = [];
    const bolNumber = clean(orderRecord.bol_number);
    const filenameBase = bolNumber || `Echo-BOL-${shipmentId}`;

    for (const path of candidatePaths(shipmentId)) {
      const response = await fetch(`${config.baseUrl}${path}`, {
        method: "GET",
        headers: { Authorization: getEchoAuthorizationHeader(config), Accept: "application/pdf,image/jpeg,image/png,application/json,*/*" },
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";
      const lowerType = contentType.toLowerCase();

      if (response.ok && (lowerType.includes("application/pdf") || lowerType.includes("image/jpeg") || lowerType.includes("image/png"))) {
        return returnDocumentResponse({ response, filename: filenameBase, sourcePath: path, supabase, orderId, shipmentId, bolNumber });
      }

      if (response.ok && lowerType.includes("application/json")) {
        const json = await response.json();
        const href = findBolHref(json);
        if (href) {
          const documentResponse = await fetchEchoDocument(href, config);
          const documentContentType = documentResponse.headers.get("content-type") || "";
          if (documentResponse.ok && (documentContentType.toLowerCase().includes("application/pdf") || documentContentType.toLowerCase().includes("image/jpeg") || documentContentType.toLowerCase().includes("image/png"))) {
            return returnDocumentResponse({ response: documentResponse, filename: filenameBase, sourcePath: href, supabase, orderId, shipmentId, bolNumber });
          }
          attempts.push({ path: href, status: documentResponse.status, statusText: documentResponse.statusText, contentType: documentContentType, bodyPreview: await readTextPreview(documentResponse) });
        }

        const base64 = maybeBase64PdfFromJson(json);
        if (base64) {
          const bytes = Buffer.from(base64.replace(/^data:application\/pdf;base64,/, ""), "base64");
          await updateOrderBolAvailable(supabase, orderId, shipmentId, bolNumber, `Echo BOL base64 document for shipment ${shipmentId}`);
          return new NextResponse(bytes, {
            status: 200,
            headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`, "X-Echo-BOL-Path": path },
          });
        }
        attempts.push({ path, status: response.status, statusText: response.statusText, contentType, bodyPreview: JSON.stringify(json).slice(0, 1200) });
        continue;
      }

      attempts.push({ path, status: response.status, statusText: response.statusText, contentType, bodyPreview: await readTextPreview(response) });
    }

    return NextResponse.json({ ok: false, error: "Echo BOL document was not returned from the attempted document endpoints.", orderId, shipmentId, bolNumber, attemptedPaths: attempts }, { status: 502 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to fetch Echo BOL." }, { status: 400 });
  }
}
