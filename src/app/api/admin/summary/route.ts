import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type CountResult = {
  label: string;
  count: number;
};

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    throw new Error("Missing admin session token.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user?.email) {
    throw new Error("Invalid admin session.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();

  if (profileError) {
    throw new Error(`Admin role lookup failed: ${profileError.message}`);
  }

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new Error("Admin role is required.");
  }

  return supabase;
}

async function countTable(supabase: ReturnType<typeof createSupabaseAdminClient>, table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

async function countActiveDistributors(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<number> {
  const { count, error } = await supabase
    .from("distributor_profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) return 0;
  return count ?? 0;
}

async function countOpenOrders(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<number> {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .not("payment_status", "eq", "paid")
    .not("shipment_status", "eq", "delivered");

  if (error) return 0;
  return count ?? 0;
}

async function countPaidOrders(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<number> {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "paid");

  if (error) return 0;
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);

    const [activeDistributors, allOrders, openOrders, paidOrders, abandonedCheckouts, leads, supportRequests, campaigns, posts] = await Promise.all([
      countActiveDistributors(supabase),
      countTable(supabase, "orders"),
      countOpenOrders(supabase),
      countPaidOrders(supabase),
      countTable(supabase, "abandoned_checkouts"),
      countTable(supabase, "customers"),
      countTable(supabase, "support_requests"),
      countTable(supabase, "marketing_campaigns"),
      countTable(supabase, "marketing_posts"),
    ]);

    const summary: CountResult[] = [
      { label: "Active Distributors", count: activeDistributors },
      { label: "All Orders", count: allOrders },
      { label: "Open Orders", count: openOrders },
      { label: "Paid Orders", count: paidOrders },
      { label: "Abandoned Checkouts", count: abandonedCheckouts },
      { label: "CRM Leads", count: leads },
      { label: "Support Requests", count: supportRequests },
      { label: "Marketing Campaigns", count: campaigns },
      { label: "Marketing Posts", count: posts },
    ];

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load admin summary." },
      { status: 401 }
    );
  }
}
