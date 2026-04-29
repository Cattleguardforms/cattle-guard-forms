import { NextRequest, NextResponse } from "next/server";
import { callEcho, readEchoBody } from "@/lib/echo/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getShipmentId(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return clean(searchParams.get("shipmentId") || searchParams.get("echoLoadId") || searchParams.get("id"));
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const shipmentId = getShipmentId(request);
    if (!shipmentId || !/^\d{8}$/.test(shipmentId)) {
      return NextResponse.json({ ok: false, error: "A valid 8 digit Echo shipmentId is required." }, { status: 400 });
    }

    const response = await callEcho(`/Shipments/${shipmentId}/documents/`);
    const echoResponse = await readEchoBody(response);

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Echo shipment documents request failed.", status: response.status, statusText: response.statusText, echoResponse },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, shipmentId, echoResponse });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to fetch Echo shipment documents." },
      { status: 400 },
    );
  }
}
