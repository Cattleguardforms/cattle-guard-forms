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

function noteValue(notes: string, label: string) {
  const line = notes.split("\n").find((entry) => entry.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return line ? line.slice(line.indexOf(":") + 1).trim() : "";
}

async function requireDistributor(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Distributor sign-in is required.");

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid distributor session.");

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Distributor role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "distributor" || profile.status !== "active") {
    throw new Error("Approved distributor access is required.");
  }

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id, company_name, contact_email, status")
    .eq("contact_email", email)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (distributorError) throw new Error(`Distributor account lookup failed: ${distributorError.message}`);
  if (!distributor) throw new Error("Active distributor account is required.");
  return { supabase, distributor };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, distributor } = await requireDistributor(request);
    const orderId = clean(new URL(request.url).searchParams.get("orderId"));
    if (!orderId) throw new Error("Order ID is required.");

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("distributor_profile_id", clean(distributor.id))
      .maybeSingle();

    if (error) throw new Error(`Warranty order lookup failed: ${error.message}`);
    if (!order) throw new Error("Order not found for this distributor.");

    const notes = clean(order.manufacturer_notes);
    const warranty = {
      customerName: noteValue(notes, "Name"),
      customerEmail: noteValue(notes, "Email"),
      customerPhone: noteValue(notes, "Phone"),
    };

    return NextResponse.json({
      ok: true,
      order: {
        id: clean(order.id),
        shortId: clean(order.id).slice(0, 8),
        distributorName: clean(distributor.company_name),
        productName: clean(order.product_name) || "CowStop Reusable Form",
        quantity: Number(order.cowstop_quantity ?? order.quantity ?? 0),
        createdAt: clean(order.created_at),
        paymentStatus: clean(order.payment_status),
        shipmentStatus: clean(order.shipment_status),
        shipToName: clean(order.ship_to_name),
        shipToAddress: [clean(order.ship_to_address || order.project_address_line1), clean(order.ship_to_city || order.project_city), clean(order.ship_to_state || order.project_state), clean(order.ship_to_zip || order.project_postal_code)].filter(Boolean).join(", "),
      },
      warranty,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load warranty paperwork." }, { status: 401 });
  }
}
