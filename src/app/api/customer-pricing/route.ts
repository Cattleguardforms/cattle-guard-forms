import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const DEFAULT_RETAIL_UNIT_PRICE = 1499;
const CUSTOMER_PRICE_KEY = "customer_retail_unit_price";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !key) throw new Error("Missing Supabase server environment variables.");
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("pricing_settings")
      .select("setting_value")
      .eq("setting_key", CUSTOMER_PRICE_KEY)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const savedPrice = Number((data as { setting_value?: unknown } | null)?.setting_value ?? 0);
    const price = Number.isFinite(savedPrice) && savedPrice > 0 && savedPrice <= 10000 ? Math.round(savedPrice * 100) / 100 : DEFAULT_RETAIL_UNIT_PRICE;

    return NextResponse.json({ ok: true, price_per_unit: price });
  } catch (error) {
    console.warn("Customer pricing endpoint fallback", error);
    return NextResponse.json({ ok: true, price_per_unit: DEFAULT_RETAIL_UNIT_PRICE });
  }
}
