import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SETTING_KEY = "customer_retail_unit_price";
const DEFAULT_PRICE = 1499;

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
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");
  return supabase;
}

function normalizePrice(value: unknown) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a valid customer price greater than 0.");
  if (price > 10000) throw new Error("Price looks too high. Enter a dollar amount like 1499 or 1200.");
  return Math.round(price * 100) / 100;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const { data, error } = await supabase
      .from("pricing_settings")
      .select("setting_value")
      .eq("setting_key", SETTING_KEY)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const savedPrice = Number((data as { setting_value?: unknown } | null)?.setting_value ?? DEFAULT_PRICE);
    const price = Number.isFinite(savedPrice) && savedPrice > 0 ? savedPrice : DEFAULT_PRICE;
    return NextResponse.json({ ok: true, price_per_unit: price, default_price: DEFAULT_PRICE });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load customer pricing." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as { price_per_unit?: unknown };
    const price = normalizePrice(body.price_per_unit);
    const { error } = await supabase
      .from("pricing_settings")
      .upsert({ setting_key: SETTING_KEY, setting_value: price, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, price_per_unit: price });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to save customer pricing." }, { status: 400 });
  }
}
