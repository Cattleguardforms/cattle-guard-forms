import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) throw new Error("Distributor sign-in is required.");

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Invalid distributor session.");

    const email = userData.user.email.toLowerCase();
    const { data: profile, error: profileError } = await supabase
      .from("app_profiles")
      .select("role, status, company_name")
      .eq("email", email)
      .maybeSingle();

    if (profileError) throw new Error(`Distributor profile lookup failed: ${profileError.message}`);
    if (!profile || profile.role !== "distributor" || profile.status !== "active") {
      throw new Error("Approved distributor access is required.");
    }

    const { data: distributor, error: distributorError } = await supabase
      .from("distributor_profiles")
      .select("id, company_name, contact_email, status, price_per_unit")
      .eq("contact_email", email)
      .eq("status", "active")
      .maybeSingle();

    if (distributorError) throw new Error(`Distributor account lookup failed: ${distributorError.message}`);
    if (!distributor) throw new Error("Active distributor account is required.");

    return NextResponse.json({
      ok: true,
      profile: {
        email,
        companyName: distributor.company_name || profile.company_name || "Approved Distributor",
        distributorId: distributor.id,
        pricePerUnit: distributor.price_per_unit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to verify distributor access." },
      { status: 401 },
    );
  }
}
