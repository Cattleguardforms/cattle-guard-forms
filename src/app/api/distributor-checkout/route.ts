import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DISTRIBUTOR_UNIT_AMOUNT = 75000;
const DISTRIBUTOR_UNIT_PRICE = 750;
const MAX_QUANTITY = 50;

function getBaseUrl(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

type CheckoutBody = {
  quantity?: number;
  email?: string;
  distributorAccountName?: string;
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

async function requireDistributor(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Approved distributor sign-in is required before checkout.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user?.email) {
    throw new Error("Invalid distributor session. Please sign in again.");
  }

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("user_id, email, company_name, role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Distributor role lookup failed: ${profileError.message}`);
  }

  if (!profile || profile.role !== "distributor" || profile.status !== "active") {
    throw new Error("Approved distributor role is required before checkout.");
  }

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id, user_id, company_name, contact_email, status, price_per_unit")
    .or(`user_id.eq.${userData.user.id},contact_email.eq.${email}`)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (distributorError) {
    throw new Error(`Distributor profile lookup failed: ${distributorError.message}`);
  }

  if (!distributor) {
    throw new Error("Active distributor profile is required before checkout.");
  }

  return { supabase, user: userData.user, profile, distributor };
}

function validateBody(body: CheckoutBody) {
  const quantity = Number(body.quantity);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }

  if (!body.email || !body.email.includes("@")) {
    throw new Error("A valid receipt email is required.");
  }

  if (body.shippingMethod === "echo") {
    const missingShipTo = [
      body.shipToName,
      body.shipToAddress,
      body.shipToCity,
      body.shipToState,
      body.shipToZip,
      body.selectedRate,
    ].some((value) => !value?.trim());

    if (missingShipTo) {
      throw new Error("Ship-to name, address, and freight option are required for Cattle Guard Forms shipping.");
    }
  }

  if (body.shippingMethod === "own" && !body.bolFileName?.trim()) {
    throw new Error("BOL upload is required when shipping on your own.");
  }

  return quantity;
}

async function createPendingOrder(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  distributorId: string;
  distributorName: string;
  body: CheckoutBody;
  quantity: number;
}) {
  const total = input.quantity * DISTRIBUTOR_UNIT_PRICE;
  const now = new Date().toISOString();

  const { data, error } = await input.supabase
    .from("orders")
    .insert({
      order_type: "distributor",
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

  if (error) {
    throw new Error(`Unable to create distributor order before checkout: ${error.message}`);
  }

  const orderId = clean(data?.id);
  if (!orderId) {
    throw new Error("Distributor order was created without an order ID.");
  }

  const { error: activityError } = await input.supabase.from("crm_activity").insert({
    activity_type: "checkout_started",
    title: `Distributor checkout started for order ${orderId}`,
    description: `${input.distributorName} started checkout for ${input.quantity} CowStop form(s).`,
    order_id: orderId,
    distributor_profile_id: input.distributorId,
    source: "distributor_checkout",
    status: "open",
  });

  if (activityError) {
    console.warn("Unable to create distributor checkout CRM activity", activityError.message);
  }

  return orderId;
}

async function attachStripeSession(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  orderId: string;
  sessionId: string;
}) {
  const now = new Date().toISOString();

  const { error } = await input.supabase
    .from("orders")
    .update({ stripe_checkout_session_id: input.sessionId, checkout_status: "created", updated_at: now })
    .eq("id", input.orderId);

  if (!error) return;

  const message = error.message || "";
  if (!message.includes("checkout_status")) {
    throw new Error(`Unable to attach Stripe session to order: ${message}`);
  }

  const { error: fallbackError } = await input.supabase
    .from("orders")
    .update({ stripe_checkout_session_id: input.sessionId, updated_at: now })
    .eq("id", input.orderId);

  if (fallbackError) {
    throw new Error(`Unable to attach Stripe session to order: ${fallbackError.message}`);
  }

  console.warn("orders.checkout_status is missing; attached Stripe session without checkout_status.");
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Checkout is not available right now." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as CheckoutBody;
    const quantity = validateBody(body);
    const { supabase, distributor } = await requireDistributor(request);
    const distributorName = clean(distributor.company_name) || clean(body.distributorAccountName) || "Approved Distributor";
    const distributorEmail = clean(distributor.contact_email) || clean(body.email);
    const orderId = await createPendingOrder({
      supabase,
      distributorId: clean(distributor.id),
      distributorName,
      body,
      quantity,
    });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
              name: "CowStop Reusable Form — Distributor Rate",
              description: "Distributor online order for CowStop reusable cattle guard forms.",
            },
          },
        },
      ],
      metadata: {
        orderId,
        order_type: "distributor",
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
      success_url: `${baseUrl}/distributor/portal?checkout=success&order=${orderId}`,
      cancel_url: `${baseUrl}/distributor/portal?checkout=cancelled&order=${orderId}`,
    });

    await attachStripeSession({ supabase, orderId, sessionId: session.id });

    return NextResponse.json({ url: session.url, orderId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start distributor checkout right now." },
      { status: 400 },
    );
  }
}
