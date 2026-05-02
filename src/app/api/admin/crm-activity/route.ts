import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ACTIVITY_TYPES = new Set(["note", "contact", "quote", "quote request", "follow up", "admin_audit", "bol_document", "stripe_payment", "distributor_checkout_started"]);
const ACTIVITY_STATUSES = new Set(["open", "pending", "follow up", "closed", "archived"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function boundedText(value: unknown, maxLength: number) {
  return clean(value).slice(0, maxLength);
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
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");

  return { supabase, adminEmail: email };
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

function sanitizeManualActivity(body: Record<string, unknown>, adminEmail: string) {
  const title = boundedText(body.title, 180);
  if (!title) throw new Error("Activity title is required.");

  const activityType = boundedText(body.activityType, 60).toLowerCase() || "note";
  if (!ACTIVITY_TYPES.has(activityType)) throw new Error("Unsupported CRM activity type.");

  const status = boundedText(body.status, 40).toLowerCase() || "open";
  if (!ACTIVITY_STATUSES.has(status)) throw new Error("Unsupported CRM activity status.");

  return {
    activity_type: activityType,
    title,
    person_company: boundedText(body.personCompany, 180),
    source: boundedText(body.source, 80) || "manual",
    status,
    last_activity: boundedText(body.lastActivity, 80) || new Date().toISOString(),
    notes: boundedText(body.notes, 2000),
    assigned_to: adminEmail,
    created_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
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
    const { supabase, adminEmail } = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const insertPayload = sanitizeManualActivity(body, adminEmail);

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
