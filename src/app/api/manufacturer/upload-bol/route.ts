import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyManufacturerUploadToken } from "@/lib/manufacturer/upload-token";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const FROM_EMAIL = "orders@cattleguardforms.com";
const REPLY_TO_EMAIL = "support@cattleguardforms.com";
const SUPPORT_EMAIL = "support@cattleguardforms.com";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "application/octet-stream"]);

type DbRecord = Record<string, unknown>;

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function safeFilename(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120) || "manufacturer-bol.pdf"; }
function noteValue(notes: string, label: string) { const line = notes.split("\n").find((entry) => entry.toLowerCase().startsWith(`${label.toLowerCase()}:`)); return line ? line.slice(line.indexOf(":") + 1).trim() : ""; }

function recipientEmails(order: DbRecord) {
  const notes = clean(order.manufacturer_notes);
  return [
    clean(order.order_contact_email),
    clean(order.distributor_email),
    clean(order.customer_email),
    noteValue(notes, "Email"),
  ].filter(isValidEmail).filter((email, index, list) => list.indexOf(email) === index);
}

function buildShippedEmail(order: DbRecord, fileName: string) {
  const orderId = clean(order.id);
  const notes = clean(order.manufacturer_notes);
  const customerName = noteValue(notes, "Name") || clean(order.ship_to_name) || clean(order.customer_display_name) || "Customer";
  const bolNumber = clean(order.bol_number) || fileName;
  const tracking = clean(order.tracking_link);
  const subject = `Order ${orderId.slice(0, 8)} has shipped - BOL available`;
  const text = [
    `Hello ${customerName},`,
    "",
    "Your Cattle Guard Forms order has shipped, and the Bill of Lading is now available.",
    "",
    `Order ID: ${orderId}`,
    `BOL: ${bolNumber}`,
    tracking ? `Tracking: ${tracking}` : null,
    "",
    "A copy of the BOL is attached for your records.",
    "",
    "Thank you,",
    "Cattle Guard Forms",
  ].filter(Boolean).join("\n");
  return { subject, text };
}

async function sendShipmentEmails(order: DbRecord, file: File, filename: string) {
  const resendApiKey = clean(process.env.RESEND_API_KEY);
  if (!resendApiKey) return { skipped: true, reason: "RESEND_API_KEY missing" };
  const resend = new Resend(resendApiKey);
  const recipients = recipientEmails(order);
  const to = recipients.length ? recipients : [SUPPORT_EMAIL];
  const cc = recipients.length ? [SUPPORT_EMAIL] : [];
  const email = buildShippedEmail(order, filename);
  const content = Buffer.from(await file.arrayBuffer());
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    cc,
    replyTo: REPLY_TO_EMAIL,
    subject: email.subject,
    text: email.text,
    attachments: [{ filename, content, contentType: file.type || "application/pdf" }],
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderId = clean(formData.get("orderId"));
    const token = clean(formData.get("token"));
    const file = formData.get("file");

    if (!orderId) throw new Error("Missing order ID.");
    if (!token) throw new Error("Missing upload token.");
    verifyManufacturerUploadToken(token, orderId);
    if (!(file instanceof File)) throw new Error("Missing BOL file.");
    if (file.size <= 0) throw new Error("The uploaded BOL file is empty.");
    if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("The BOL file is too large. Maximum size is 15 MB.");
    if (file.type && !ALLOWED_TYPES.has(file.type)) throw new Error("Only PDF, JPG, or PNG BOL files are allowed.");

    const supabase = createSupabaseAdminClient();
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
    if (!order) throw new Error("Order not found.");

    const filename = safeFilename(file.name || `manufacturer-bol-${orderId}.pdf`);
    const storagePath = `${orderId}/manufacturer_bol/${Date.now()}-${filename}`;
    const content = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(ORDER_FILES_BUCKET).upload(storagePath, content, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });
    if (uploadError) throw new Error(`BOL upload failed: ${uploadError.message}`);

    const { data: inserted, error: insertError } = await supabase.from("order_files").insert({
      order_id: orderId,
      file_type: "original_bol",
      file_name: filename,
      storage_path: storagePath,
      content_type: file.type || "application/pdf",
      size_bytes: file.size,
      uploaded_by_role: "manufacturer",
    }).select("id, order_id, file_type, file_name, created_at").single();
    if (insertError) throw new Error(`BOL metadata insert failed: ${insertError.message}`);

    const timestamp = new Date().toISOString();
    const previousNotes = clean((order as DbRecord).manufacturer_notes);
    await supabase.from("orders").update({
      shipment_status: "shipped",
      status: "shipped",
      bol_file: `Manufacturer BOL uploaded: ${storagePath}`,
      manufacturer_notes: [previousNotes, `Manufacturer BOL uploaded: ${timestamp} (${filename})`].filter(Boolean).join("\n"),
      updated_at: timestamp,
    }).eq("id", orderId);

    const emailResult = await sendShipmentEmails(order as DbRecord, file, filename);

    await supabase.from("crm_activity").insert({
      activity_type: "bol_document",
      title: `Manufacturer BOL uploaded for order ${orderId}`,
      description: `Manufacturer uploaded ${filename}. Shipment notification email triggered to customer/distributor and support.`,
      order_id: orderId,
      customer_id: clean((order as DbRecord).customer_id) || null,
      distributor_profile_id: clean((order as DbRecord).distributor_profile_id) || null,
      source: "manufacturer_upload",
      status: "closed",
    });

    return NextResponse.json({ ok: true, file: inserted, emailResult });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to upload manufacturer BOL." }, { status: 400 });
  }
}
