import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ContentInput = {
  page_key?: unknown;
  section_key?: unknown;
  label?: unknown;
  content?: unknown;
  content_type?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();
  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");
  return supabase;
}

function normalizeInput(input: ContentInput) {
  const page_key = clean(input.page_key).toLowerCase();
  const section_key = clean(input.section_key).toLowerCase();
  const label = clean(input.label) || section_key;
  const content = clean(input.content);
  const content_type = clean(input.content_type) || "text";
  if (!page_key) throw new Error("Page key is required.");
  if (!section_key) throw new Error("Section key is required.");
  if (!content) throw new Error("Content is required.");
  return { page_key, section_key, label, content, content_type, updated_at: new Date().toISOString() };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const pageKey = clean(searchParams.get("page_key")).toLowerCase();
    let query = supabase
      .from("site_content_blocks")
      .select("id,page_key,section_key,label,content,content_type,created_at,updated_at")
      .order("page_key", { ascending: true })
      .order("section_key", { ascending: true });
    if (pageKey) query = query.eq("page_key", pageKey);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, blocks: data ?? [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load site content." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const input = normalizeInput((await request.json()) as ContentInput);
    const { data, error } = await supabase
      .from("site_content_blocks")
      .upsert(input, { onConflict: "page_key,section_key" })
      .select("id,page_key,section_key,label,content,content_type,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, block: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to save site content." }, { status: 400 });
  }
}
