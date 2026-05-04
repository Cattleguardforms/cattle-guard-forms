import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_RETAIL_UNIT_PRICE = 1499;
const CUSTOMER_PRICE_KEY = "customer_retail_unit_price";
const MAX_QUANTITY = 30;

type CustomerCheckoutBody = {
  quantity?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  deliveryType?: string;
  liftgateRequired?: string;
  selectedRate?: string;
  freightCharge?: number;
  notes?: string;
};

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function getBaseUrl(request: NextRequest) {
  const configured = clean(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
  if (configured) return configured;
  const origin = clean(request.headers.get("origin")).replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production" && origin) return origin;
  return "https://cattleguardforms.com";
}
function getSupabaseAdminClient() { const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!supabaseUrl || !key) throw new Error("Missing Supabase server environment variables."); return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
function getQuantity(body: CustomerCheckoutBody) { const quantity = Number(body.quantity); if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`); return quantity; }
function getDiscountRate(quantity: number) { if (quantity >= 20) return 0.25; if (quantity >= 5) return 0.1; return 0; }
function unitAmountFromPrice(price: number) { return Math.round(price * 100); }
function getProductTotalCents(quantity: number, unitPrice: number) { const subtotal = quantity * unitAmountFromPrice(unitPrice); const discount = Math.round(subtotal * getDiscountRate(quantity)); return subtotal - discount; }
function getFreightChargeCents(body: CustomerCheckoutBody) { const freightCharge = Number(body.freightCharge ?? 0); if (!Number.isFinite(freightCharge) || freightCharge <= 0) throw new Error("Selected freight charge is required before checkout."); return Math.round(freightCharge * 100); }
function customerFullName(body: CustomerCheckoutBody) { return [clean(body.firstName), clean(body.lastName)].filter(Boolean).join(" ").trim() || clean(body.shipToName) || clean(body.company) || clean(body.email); }

async function getCustomerUnitPrice(supabase: ReturnType<typeof getSupabaseAdminClient>) {
  const { data, error } = await supabase.from("pricing_settings").select("setting_value").eq("setting_key", CUSTOMER_PRICE_KEY).maybeSingle();
  if (error) {
    console.warn("Customer pricing settings lookup skipped", error.message);
    return DEFAULT_RETAIL_UNIT_PRICE;
  }
  const savedPrice = Number((data as { setting_value?: unknown } | null)?.setting_value ?? 0);
  if (Number.isFinite(savedPrice) && savedPrice > 0 && savedPrice <= 10000) return Math.round(savedPrice * 100) / 100;
  return DEFAULT_RETAIL_UNIT_PRICE;
}

function validateBody(body: CustomerCheckoutBody) {
  const quantity = getQuantity(body);
  if (!clean(body.email).includes("@")) throw new Error("A valid order contact email is required.");
  if (clean(body.phone).replace(/[^0-9]/g, "").length < 10) throw new Error("A valid delivery contact phone is required.");
  const required = [body.shipToName, body.shipToAddress, body.shipToCity, body.shipToState, body.shipToZip, body.deliveryType, body.liftgateRequired, body.selectedRate];
  if (required.some((value) => !clean(value))) throw new Error("Shipping details, delivery details, and selected freight option are required.");
  getFreightChargeCents(body);
  return quantity;
}

async function upsertCustomer(input: { supabase: ReturnType<typeof getSupabaseAdminClient>; body: CustomerCheckoutBody }) {
  const email = clean(input.body.email).toLowerCase();
  const customerData = { email, first_name: clean(input.body.firstName) || null, last_name: clean(input.body.lastName) || null, phone: clean(input.body.phone) || null, company: clean(input.body.company) || null, address_line1: clean(input.body.shipToAddress) || null, address_line2: clean(input.body.shipToAddress2) || null, city: clean(input.body.shipToCity) || null, state: clean(input.body.shipToState) || null, postal_code: clean(input.body.shipToZip) || null };
  const { data: existing, error: lookupError } = await input.supabase.from("customers").select("id").eq("email", email).maybeSingle();
  if (lookupError) throw new Error(`Customer lookup failed: ${lookupError.message}`);
  if (existing?.id) { const { error } = await input.supabase.from("customers").update(customerData).eq("id", existing.id); if (error) throw new Error(`Customer update failed: ${error.message}`); return existing.id as string; }
  const { data, error } = await input.supabase.from("customers").insert(customerData).select("id").single();
  if (error || !data?.id) throw new Error(`Customer create failed: ${error?.message || "missing customer id"}`);
  return data.id as string;
}

async function createPendingOrder(input: { supabase: ReturnType<typeof getSupabaseAdminClient>; customerId: string; body: CustomerCheckoutBody; quantity: number; unitPrice: number }) {
  const now = new Date().toISOString();
  const productTotal = getProductTotalCents(input.quantity, input.unitPrice) / 100;
  const freightCharge = getFreightChargeCents(input.body) / 100;
  const total = productTotal + freightCharge;
  const addressLine2 = clean(input.body.shipToAddress2);
  const warrantyNotes = [`Warranty customer information:`, `Name: ${customerFullName(input.body)}`, `Email: ${clean(input.body.email)}`, `Phone: ${clean(input.body.phone)}`, `Delivery type: ${clean(input.body.deliveryType)}`, `Liftgate required: ${clean(input.body.liftgateRequired)}`, `Shipping method: Cattle Guard Forms freight quote`, `Customer unit price: $${input.unitPrice.toFixed(2)}`].join("\n");
  const notes = [clean(input.body.notes), warrantyNotes, `Selected freight: ${clean(input.body.selectedRate)}`, `Delivery type: ${clean(input.body.deliveryType)}`, `Liftgate required: ${clean(input.body.liftgateRequired)}`, addressLine2 ? `Delivery address line 2: ${addressLine2}` : "", `Freight & handling: $${freightCharge.toFixed(2)}`].filter(Boolean).join("\n");
  const { data, error } = await input.supabase.from("orders").insert({
    customer_id: input.customerId,
    order_type: "customer",
    product_name: "CowStop Reusable Form",
    product_type: "Cowstop",
    product_status: "active",
    status: "pending",
    payment_status: "pending",
    quantity: input.quantity,
    cowstop_quantity: input.quantity,
    unit_price: input.unitPrice,
    total,
    shipping_method: "echo",
    customer_name: customerFullName(input.body),
    customer_email: clean(input.body.email).toLowerCase(),
    customer_phone: clean(input.body.phone),
    warranty_customer_name: customerFullName(input.body),
    warranty_customer_email: clean(input.body.email).toLowerCase(),
    warranty_customer_phone: clean(input.body.phone),
    ship_to_name: clean(input.body.shipToName),
    ship_to_address: clean(input.body.shipToAddress),
    ship_to_city: clean(input.body.shipToCity),
    ship_to_state: clean(input.body.shipToState),
    ship_to_zip: clean(input.body.shipToZip),
    selected_rate: clean(input.body.selectedRate),
    freight_charge: freightCharge,
    project_address_line1: clean(input.body.shipToAddress),
    project_address_line2: addressLine2 || null,
    project_city: clean(input.body.shipToCity),
    project_state: clean(input.body.shipToState),
    project_postal_code: clean(input.body.shipToZip),
    manufacturer_notes: warrantyNotes,
    notes,
    created_at: now,
    updated_at: now,
  }).select("id").single();
  if (error || !data?.id) throw new Error(`Unable to create customer order before checkout: ${error?.message || "missing order id"}`);
  const orderId = clean(data.id);
  const { error: activityError } = await input.supabase.from("crm_activity").insert({ activity_type: "checkout_started", title: `Customer checkout started for order ${orderId}`, description: `${clean(input.body.email)} started checkout for ${input.quantity} CowStop form(s) at $${input.unitPrice.toFixed(2)} each.`, order_id: orderId, source: "customer_checkout", status: "open" });
  if (activityError) console.warn("Unable to create customer checkout CRM activity", activityError.message);
  return orderId;
}

async function attachStripeSession(input: { supabase: ReturnType<typeof getSupabaseAdminClient>; orderId: string; sessionId: string }) {
  const now = new Date().toISOString();
  const { error } = await input.supabase.from("orders").update({ stripe_checkout_session_id: input.sessionId, checkout_status: "created", updated_at: now }).eq("id", input.orderId);
  if (!error) return;
  const message = error.message || "";
  if (!message.includes("checkout_status")) throw new Error(`Unable to attach Stripe session to order: ${message}`);
  await input.supabase.from("orders").update({ stripe_checkout_session_id: input.sessionId, updated_at: now }).eq("id", input.orderId);
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Checkout is not available right now." }, { status: 500 });
  try {
    const body = (await request.json()) as CustomerCheckoutBody;
    const quantity = validateBody(body);
    const supabase = getSupabaseAdminClient();
    const unitPrice = await getCustomerUnitPrice(supabase);
    const customerId = await upsertCustomer({ supabase, body });
    const orderId = await createPendingOrder({ supabase, customerId, body, quantity, unitPrice });
    const productTotalCents = getProductTotalCents(quantity, unitPrice);
    const freightChargeCents = getFreightChargeCents(body);
    const email = clean(body.email).toLowerCase();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = getBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        { quantity: 1, price_data: { currency: "usd", unit_amount: productTotalCents, product_data: { name: "CowStop Reusable Form", description: `${quantity} CowStop reusable concrete cattle guard form${quantity === 1 ? "" : "s"} at $${unitPrice.toFixed(2)} each` } } },
        { quantity: 1, price_data: { currency: "usd", unit_amount: freightChargeCents, product_data: { name: "Freight & Handling", description: clean(body.selectedRate) || "Selected freight option." } } },
      ],
      metadata: { orderId, order_type: "customer", customer_id: customerId, order_contact_email: email, warranty_customer_name: customerFullName(body), warranty_customer_email: email, warranty_customer_phone: clean(body.phone), quantity: String(quantity), unit_price: unitPrice.toFixed(2), product_total: String(productTotalCents / 100), freight_charge: String(freightChargeCents / 100), selected_rate: clean(body.selectedRate), contact_phone: clean(body.phone), delivery_type: clean(body.deliveryType), liftgate_required: clean(body.liftgateRequired), ship_to_name: clean(body.shipToName), ship_to_address: clean(body.shipToAddress), ship_to_address2: clean(body.shipToAddress2), ship_to_city: clean(body.shipToCity), ship_to_state: clean(body.shipToState), ship_to_zip: clean(body.shipToZip) },
      success_url: `${baseUrl}/quote?checkout=success&order=${orderId}`,
      cancel_url: `${baseUrl}/quote?checkout=cancelled&order=${orderId}`,
    });
    await attachStripeSession({ supabase, orderId, sessionId: session.id });
    return NextResponse.json({ url: session.url, orderId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start customer checkout right now." }, { status: 400 });
  }
}
