import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const { data, error } = await supabase
      .from("seo_audit_findings")
      .select("id,page_url,finding_type,severity,title,description,recommendation,status,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, findings: data ?? [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load SEO audit findings." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id);
    const status = clean(body.status) || "open";
    if (!id) throw new Error("Finding id is required.");
    const { data, error } = await supabase
      .from("seo_audit_findings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,status")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, finding: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update SEO finding." }, { status: 400 });
  }
}
