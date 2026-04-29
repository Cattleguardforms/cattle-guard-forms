import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const APPROVED_ADMIN_EMAILS = new Set(["orders@cattleguardforms.com", "support@cattleguardforms.com"]);

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

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);

  const hasAdminProfile = Boolean(profile && profile.role === "admin" && profile.status === "active");
  if (!hasAdminProfile && !APPROVED_ADMIN_EMAILS.has(email)) throw new Error("Admin role is required.");

  return supabase;
}

function activityValue(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = clean(record[key]);
    if (value) return value;
  }
  return fallback;
}

function normalizeActivity(record: Record<string, unknown>) {
  const title = activityValue(record, ["title", "activity_title", "subject", "message", "description"], "CRM activity");
  const activityType = activityValue(record, ["activity_type", "type", "category"], "note");
  const personCompany = activityValue(record, ["person_company", "person", "company", "customer_name", "name", "email"], "Not set");
  const source = activityValue(record, ["source", "origin", "channel"], "crm");
  const status = activityValue(record, ["status", "activity_status"], "open");
  const lastActivity = activityValue(record, ["last_activity", "last_activity_at", "created_at", "updated_at"], "");
  const notes = activityValue(record, ["notes", "note", "body", "details", "description"], "");

  return {
    id: clean(record.id) || `${Date.now()}`,
    activityType,
    title,
    personCompany,
    source,
    status,
    lastActivity,
    notes,
    raw: record,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const { data, error } = await supabase
      .from("crm_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(`CRM activity lookup failed: ${error.message}`);

    const records = ((data ?? []) as Record<string, unknown>[]).map(normalizeActivity);
    const summary = {
      records: records.length,
      contacts: records.filter((record) => record.activityType === "contact").length,
      quotes: records.filter((record) => record.activityType === "quote request" || record.activityType === "quote").length,
      followUps: records.filter((record) => record.activityType === "follow up" || record.status === "follow up").length,
      notes: records.filter((record) => record.activityType === "note").length,
      open: records.filter((record) => record.status === "open" || record.status === "pending" || record.status === "follow up").length,
    };

    return NextResponse.json({ ok: true, summary, records });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load CRM activity." },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;

    const title = clean(body.title);
    if (!title) return NextResponse.json({ ok: false, error: "Activity title is required." }, { status: 400 });

    const insertPayload = {
      activity_type: clean(body.activityType) || "note",
      title,
      person_company: clean(body.personCompany),
      source: clean(body.source) || "manual",
      status: clean(body.status) || "open",
      last_activity: clean(body.lastActivity) || new Date().toISOString(),
      notes: clean(body.notes),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("crm_activity").insert(insertPayload).select("*").single();
    if (error) throw new Error(`CRM activity create failed: ${error.message}`);

    return NextResponse.json({ ok: true, record: normalizeActivity((data ?? {}) as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to create CRM activity." },
      { status: 400 },
    );
  }
}
