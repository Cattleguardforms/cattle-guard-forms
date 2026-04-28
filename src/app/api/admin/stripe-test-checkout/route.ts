import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

const DISTRIBUTOR_UNIT_AMOUNT = 75000;
const DISTRIBUTOR_UNIT_PRICE = 750;
const MAX_QUANTITY = 50;

type TestCheckoutBody = {
  distributorEmail?: string;
  quantity?: number;
  shippingMethod?: "echo" | "own";
  shipToName?: string;
  shipToAddress?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  selectedRate?: string;
  bolFileName?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBaseUrl(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

async function requireAdmin(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Admin sign-in is required.");

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid admin session.");

  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();

  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new Error("Admin role is required.");
  }

  return supabase;
}

function validateBody(body: TestCheckoutBody) {
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }

  const distributorEmail = clean(body.distributorEmail).toLowerCase();
  if (!distributorEmail || !distributorEmail.includes("@")) {
    throw new Error("A valid distributor email is required.");
  }

  if (body.shippingMethod === "echo") {
    const missingShipTo = [
      body.shipToName,
      body.shipToAddress,
      body.shipToCity,
      body.shipToState,
      body.shipToZip,
      body.selectedRate,
    ].some((value) => !clean(value));

    if (missingShipTo) {
      throw new Error("Ship-to name, address, and freight option are required for the sandbox checkout test.");
    }
  }

  if (body.shippingMethod === "own" && !clean(body.bolFileName)) {
    throw new Error("BOL file name is required when testing own-shipper checkout.");
  }

  return { quantity, distributorEmail };
}

async function findDistributor(supabase: ReturnType<typeof createSupabaseAdminClient>, distributorEmail: string) {
  const { data: appProfile, error: appProfileError } = await supabase
    .from("app_profiles")
    .select("email, role, status")
    .eq("email", distributorEmail)
    .maybeSingle();

  if (appProfileError) throw new Error(`Distributor app profile lookup failed: ${appProfileError.message}`);
  if (!appProfile || appProfile.role !== "distributor" || appProfile.status !== "active") {
    throw new Error("The test distributor must have app_profiles.role = distributor and status = active.");
  }

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id, company_name, contact_email, status, price_per_unit")
    .eq("contact_email", distributorEmail)
    .eq("status", "active")
    .maybeSingle();

  if (distributorError) throw new Error(`Distributor profile lookup failed: ${distributorError.message}`);
  if (!distributor) {
    throw new Error("The test distributor must have an active distributor_profiles record.");
  }

  return distributor;
}

async function createPendingOrder(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  distributorId: string;
  distributorName: string;
  body: TestCheckoutBody;
  quantity: number;
}) {
  const now = new Date().toISOString();
  const total = input.quantity * DISTRIBUTOR_UNIT_PRICE;

  const { data, error } = await input.supabase
    .from("orders")
    .insert({
      order_type: "distributor_sandbox_test",
      product_name: "CowStop Reusable Form",
      product_status: "active",
      cowstop_quantity: input.quantity,
      unit_price: DISTRIBUTOR_UNIT_PRICE,
      total,
      payment_status: "pending",
      shipping_method: input.body.shippingMethod ?? "echo",
      bol_file: clean(input.body.bolFileName) || null,
      distributor_profile_id: input.distributorId,
      raw_vendor_name: input.distributorName,
      normalized_vendor_name: input.distributorName,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Unable to create sandbox test order: ${error.message}`);
  const orderId = clean(data?.id);
  if (!orderId) throw new Error("Sandbox test order was created without an order ID.");

  await input.supabase.from("crm_activity").insert({
    activity_type: "sandbox_checkout_started",
    title: `Sandbox checkout started for order ${orderId}`,
    description: `Admin started sandbox Stripe checkout for ${input.distributorName}.`,
    order_id: orderId,
    distributor_profile_id: input.distributorId,
    source: "admin_stripe_test",
    status: "open",
  });

  return orderId;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TestCheckoutBody;
    const { quantity, distributorEmail } = validateBody(body);
    const supabase = await requireAdmin(request);
    const distributor = await findDistributor(supabase, distributorEmail);
    const distributorName = clean(distributor.company_name) || "Approved Distributor";
    const orderId = await createPendingOrder({
      supabase,
      distributorId: clean(distributor.id),
      distributorName,
      body,
      quantity,
    });

    const baseUrl = getBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: distributorEmail,
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: DISTRIBUTOR_UNIT_AMOUNT,
            product_data: {
              name: "CowStop Reusable Form — Sandbox Distributor Test",
              description: "Sandbox checkout test for CowStop reusable cattle guard forms.",
            },
          },
        },
      ],
      metadata: {
        orderId,
        order_type: "distributor_sandbox_test",
        distributor_profile_id: clean(distributor.id),
        distributor_account_name: distributorName,
        quantity: String(quantity),
        unit_price: "750.00",
        shipping_method: body.shippingMethod ?? "",
        ship_to_name: body.shipToName ?? "",
        ship_to_address: body.shipToAddress ?? "",
        ship_to_address_2: body.shipToAddress2 ?? "",
        ship_to_city: body.shipToCity ?? "",
        ship_to_state: body.shipToState ?? "",
        ship_to_zip: body.shipToZip ?? "",
        selected_rate: body.selectedRate ?? "",
        bol_file_name: body.bolFileName ?? "",
      },
      success_url: `${baseUrl}/admin/stripe-test?checkout=success&order=${orderId}`,
      cancel_url: `${baseUrl}/admin/stripe-test?checkout=cancelled&order=${orderId}`,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        checkout_status: "created",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw new Error(`Unable to attach Stripe session to test order: ${updateError.message}`);

    return NextResponse.json({ ok: true, url: session.url, orderId, stripeSessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to start sandbox checkout test." },
      { status: 400 },
    );
  }
}
