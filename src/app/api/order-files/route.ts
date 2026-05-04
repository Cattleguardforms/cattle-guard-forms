import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const APPROVED_ADMIN_EMAILS = new Set(["orders@cattleguardforms.com", "support@cattleguardforms.com"]);
const ALLOWED_FILE_TYPES = new Set(["original_bol", "signed_bol", "shipping_document", "other_order_attachment"]);
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

type Actor = {
  userId: string;
  email: string;
  role: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function manufacturerEmails() {
  return clean(process.env.MANUFACTURER_EMAILS)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

function safeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120);
  return cleaned || "order-file";
}

async function requireOrderFileActor(request: NextRequest): Promise<{ supabase: ReturnType<typeof createSupabaseAdminClient>; actor: Actor }> {
  const token = getBearerToken(request);
  if (!token) throw new Error("Missing session token.");

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid session.");

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Role lookup failed: ${profileError.message}`);

  const role = clean(profile?.role);
  const status = clean(profile?.status);
  const isApprovedAdmin = APPROVED_ADMIN_EMAILS.has(email);
  const isAdmin = (role === "admin" && status === "active") || isApprovedAdmin;
  const isDistributor = role === "distributor" && status === "active";
  const isManufacturer = manufacturerEmails().includes(email);

  if (!isAdmin && !isDistributor && !isManufacturer) throw new Error("Authorized admin, distributor, or manufacturer role is required.");

  return {
    supabase,
    actor: {
      userId: userData.user.id,
      email,
      role: isAdmin ? "admin" : isDistributor ? "distributor" : "manufacturer",
    },
  };
}

async function assertOrderVisible(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  actor: Actor,
  orderId: string,
) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!order) throw new Error("Order not found.");

  if (actor.role === "admin" || actor.role === "manufacturer") return;

  const orderRecord = order as Record<string, unknown>;
  const visibleEmails = [
    clean(orderRecord.distributor_email),
    clean(orderRecord.order_contact_email),
    clean(orderRecord.customer_email),
    clean(orderRecord.contact_email),
  ]
    .filter(Boolean)
    .map((email) => email.toLowerCase());

  if (!visibleEmails.includes(actor.email)) {
    throw new Error("This order is not available to the signed-in account.");
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = clean(request.nextUrl.searchParams.get("orderId"));
    if (!orderId) throw new Error("Missing orderId.");

    const { supabase, actor } = await requireOrderFileActor(request);
    await assertOrderVisible(supabase, actor, orderId);

    const { data: files, error } = await supabase
      .from("order_files")
      .select("id, order_id, file_type, file_name, content_type, size_bytes, uploaded_by_role, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Order file lookup failed: ${error.message}`);

    return NextResponse.json({ ok: true, files: files ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load order files." },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, actor } = await requireOrderFileActor(request);
    const formData = await request.formData();
    const orderId = clean(formData.get("orderId"));
    const fileType = clean(formData.get("fileType"));
    const file = formData.get("file");

    if (!orderId) throw new Error("Missing orderId.");
    if (!ALLOWED_FILE_TYPES.has(fileType)) throw new Error("Invalid file type.");
    if (!(file instanceof File)) throw new Error("Missing upload file.");
    if (file.size <= 0) throw new Error("Upload file is empty.");
    if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("Upload file is too large. Maximum size is 15 MB.");
    if (file.type && !ALLOWED_CONTENT_TYPES.has(file.type)) throw new Error("Only PDF, JPG, and PNG files are allowed.");

    await assertOrderVisible(supabase, actor, orderId);

    const filename = safeFilename(file.name);
    const storagePath = `${orderId}/${fileType}/${Date.now()}-${filename}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(ORDER_FILES_BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

    const { data: inserted, error: insertError } = await supabase
      .from("order_files")
      .insert({
        order_id: orderId,
        file_type: fileType,
        file_name: filename,
        storage_path: storagePath,
        content_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: actor.userId,
        uploaded_by_role: actor.role,
      })
      .select("id, order_id, file_type, file_name, content_type, size_bytes, uploaded_by_role, created_at")
      .single();

    if (insertError) throw new Error(`File metadata insert failed: ${insertError.message}`);

    return NextResponse.json({ ok: true, file: inserted });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to upload order file." },
      { status: 400 },
    );
  }
}
