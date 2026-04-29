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

function distributorKey(profile: Record<string, unknown>) {
  const email = clean(profile.email || profile.contact_email).toLowerCase();
  if (email) return `email:${email}`;

  const name = clean(profile.company_name || profile.company || profile.business_name || profile.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return name ? `name:${name}` : `id:${clean(profile.id)}`;
}

function mergeProfiles(existing: Record<string, unknown>, next: Record<string, unknown>) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(next)) {
    const current = merged[key];
    if ((current === null || current === undefined || current === "") && value !== null && value !== undefined && value !== "") {
      merged[key] = value;
    }
  }

  const existingStatus = clean(existing.status);
  const nextStatus = clean(next.status);
  if (existingStatus !== "active" && nextStatus === "active") merged.status = next.status;
  if (existingStatus === "disabled" || nextStatus === "disabled") merged.status = "disabled";

  return merged;
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

function dollars(centsOrDollars: unknown) {
  const amount = Number(centsOrDollars ?? 0);
  const normalized = amount > 10000 ? amount / 100 : amount;
  return normalized.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);

    const { data: profiles, error: profileError } = await supabase
      .from("distributor_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileError) throw new Error(`Distributor lookup failed: ${profileError.message}`);

    const rawDistributorRows = (profiles ?? []) as Record<string, unknown>[];
    const distributorRows = Array.from(
      rawDistributorRows.reduce<Map<string, Record<string, unknown>>>((map, profile) => {
        const key = distributorKey(profile);
        const existing = map.get(key);
        map.set(key, existing ? mergeProfiles(existing, profile) : profile);
        return map;
      }, new Map()).values(),
    );

    const emails = distributorRows
      .map((profile) => clean(profile.email || profile.contact_email).toLowerCase())
      .filter(Boolean);

    let ordersByEmail: Record<string, Record<string, unknown>[]> = {};
    if (emails.length) {
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .in("order_contact_email", emails);

      if (!orderError && orders) {
        ordersByEmail = ((orders ?? []) as Record<string, unknown>[]).reduce<Record<string, Record<string, unknown>[]>>((acc, order) => {
          const email = clean(order.order_contact_email).toLowerCase();
          if (!email) return acc;
          if (!acc[email]) acc[email] = [];
          acc[email].push(order);
          return acc;
        }, {});
      }
    }

    const distributors = distributorRows.map((profile) => {
      const email = clean(profile.email || profile.contact_email).toLowerCase();
      const relatedOrders = ordersByEmail[email] ?? [];
      const activeOrders = relatedOrders.filter((order) => clean(order.shipment_status) !== "archived");
      const paidOrders = relatedOrders.filter((order) => clean(order.payment_status) === "paid");
      const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total ?? order.amount_paid ?? 0), 0);

      return {
        id: clean(profile.id),
        name: clean(profile.company_name || profile.company || profile.business_name || profile.name) || email || "Distributor",
        contact: clean(profile.contact_name || profile.name || profile.full_name) || "Not set",
        email,
        phone: clean(profile.phone || profile.contact_phone) || "Not set",
        status: clean(profile.status) || "active",
        price_per_unit: Number(profile.price_per_unit ?? 0),
        orders: relatedOrders.length,
        active: activeOrders.length,
        revenue: dollars(revenue),
      };
    });

    const summary = {
      distributors: distributors.length,
      active: distributors.filter((row) => row.status === "active").length,
      totalOrders: distributors.reduce((sum, row) => sum + row.orders, 0),
      activeOrders: distributors.reduce((sum, row) => sum + row.active, 0),
    };

    return NextResponse.json({ ok: true, summary, distributors });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load distributors." },
      { status: 401 },
    );
  }
}
