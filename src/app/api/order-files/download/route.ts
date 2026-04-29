import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_FILES_BUCKET = "order-files";
const APPROVED_ADMIN_EMAILS = new Set(["orders@cattleguardforms.com", "support@cattleguardforms.com"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

async function requireActor(request: NextRequest) {
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
  const isAdmin = (role === "admin" && status === "active") || APPROVED_ADMIN_EMAILS.has(email);
  const isDistributor = role === "distributor" && status === "active";

  if (!isAdmin && !isDistributor) throw new Error("Authorized admin or distributor role is required.");

  return { supabase, email, role: isAdmin ? "admin" : "distributor" };
}

async function assertOrderVisible(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  actor: { email: string; role: string },
  orderId: string,
) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!order) throw new Error("Order not found.");
  if (actor.role === "admin") return;

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
    const fileId = clean(request.nextUrl.searchParams.get("fileId"));
    if (!fileId) throw new Error("Missing fileId.");

    const actor = await requireActor(request);
    const { supabase } = actor;

    const { data: file, error: fileError } = await supabase
      .from("order_files")
      .select("id, order_id, file_type, file_name, storage_path")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError) throw new Error(`Order file lookup failed: ${fileError.message}`);
    if (!file) throw new Error("Order file not found.");

    await assertOrderVisible(supabase, actor, clean(file.order_id));

    const { data: signed, error: signedError } = await supabase.storage
      .from(ORDER_FILES_BUCKET)
      .createSignedUrl(clean(file.storage_path), 60 * 5, {
        download: clean(file.file_name) || true,
      });

    if (signedError || !signed?.signedUrl) {
      throw new Error(`Signed download URL failed: ${signedError?.message ?? "No signed URL returned."}`);
    }

    return NextResponse.json({ ok: true, url: signed.signedUrl, fileName: file.file_name, fileType: file.file_type });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to download order file." },
      { status: 401 },
    );
  }
}
