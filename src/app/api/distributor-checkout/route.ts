import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_DISTRIBUTOR_UNIT_PRICE = 750;
const MAX_QUANTITY = 50;
const MAX_COWSTOPS_PER_PALLET = 6;
const ORDER_FILES_BUCKET = "order-files";
const MAX_BOL_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_BOL_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

type PalletSpec = { length: number; width: number; height: number; weight: number };
type DbRecord = Record<string, unknown>;

const PALLET_SPECS_BY_UNIT_COUNT: Record<1 | 2 | 3 | 4 | 5 | 6, PalletSpec> = {
  1: { length: 72, width: 48, height: 20, weight: 105 },
  2: { length: 72, width: 48, height: 20, weight: 190 },
  3: { length: 72, width: 48, height: 36, weight: 270 },
  4: { length: 72, width: 48, height: 36, weight: 355 },
  5: { length: 72, width: 48, height: 52, weight: 440 },
  6: { length: 72, width: 48, height: 52, weight: 525 },
};

function getBaseUrl(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function getBearerToken(request: NextRequest) { const authHeader = request.headers.get("authorization") || ""; return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""; }
function safeFilename(name: string) { const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120); return cleaned || "bol-file"; }

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

function getPalletPlan(quantity: number) {
  const fullPallets = Math.floor(quantity / MAX_COWSTOPS_PER_PALLET);
  const remainder = quantity % MAX_COWSTOPS_PER_PALLET;
  const unitsOnLastPallet = (remainder === 0 ? MAX_COWSTOPS_PER_PALLET : remainder) as 1 | 2 | 3 | 4 | 5 | 6;
  const palletCount = Math.ceil(quantity / MAX_COWSTOPS_PER_PALLET);
  const lastPallet = PALLET_SPECS_BY_UNIT_COUNT[unitsOnLastPallet];

  return {
    palletCount,
    length: lastPallet.length,
    width: lastPallet.width,
    height: lastPallet.height,
    weight: fullPallets * PALLET_SPECS_BY_UNIT_COUNT[6].weight + (remainder === 0 ? 0 : lastPallet.weight),
  };
}

function distributorUnitPrice(distributor: DbRecord) {
  const savedPrice = Number(distributor.price_per_unit ?? 0);
  if (Number.isFinite(savedPrice) && savedPrice > 0 && savedPrice <= 10000) return Math.round(savedPrice * 100) / 100;
  return DEFAULT_DISTRIBUTOR_UNIT_PRICE;
}

function unitAmountFromPrice(price: number) { return Math.round(price * 100); }

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
  freightCharge?: number;
  contactPhone?: string;
  deliveryType?: string;
  liftgateRequired?: string;
  bolFileName?: string;
  warrantyCustomerName?: string;
  warrantyCustomerEmail?: string;
  warrantyCustomerPhone?: string;
};

async function readCheckoutInput(request: NextRequest): Promise<{ body: CheckoutBody; bolFile: File | null }> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("bolFile");
    return {
      body: {
        quantity: Number(formData.get("quantity")),
        email: clean(formData.get("email")),
        distributorAccountName: clean(formData.get("distributorAccountName")),
        shippingMethod: clean(formData.get("shippingMethod")) === "own" ? "own" : "echo",
        shipToName: clean(formData.get("shipToName")),
        shipToAddress: clean(formData.get("shipToAddress")),
        shipToAddress2: clean(formData.get("shipToAddress2")),
        shipToCity: clean(formData.get("shipToCity")),
        shipToState: clean(formData.get("shipToState")),
        shipToZip: clean(formData.get("shipToZip")),
        selectedRate: clean(formData.get("selectedRate")),
        freightCharge: Number(formData.get("freightCharge") ?? 0),
        contactPhone: clean(formData.get("contactPhone")),
        deliveryType: clean(formData.get("deliveryType")),
        liftgateRequired: clean(formData.get("liftgateRequired")),
        warrantyCustomerName: clean(formData.get("warrantyCustomerName")),
        warrantyCustomerEmail: clean(formData.get("warrantyCustomerEmail")),
        warrantyCustomerPhone: clean(formData.get("warrantyCustomerPhone")),
        bolFileName: file instanceof File ? file.name : clean(formData.get("bolFileName")),
      },
      bolFile: file instanceof File ? file : null,
    };
  }

  return { body: (await request.json()) as CheckoutBody, bolFile: null };
}

async function requireDistributor(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Approved distributor sign-in is required before checkout.");

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid distributor session. Please sign in again.");

  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("user_id, email, company_name, role, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw new Error(`Distributor role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "distributor" || profile.status !== "active") throw new Error("Approved distributor role is required before checkout.");

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id, user_id, company_name, contact_email, status, price_per_unit")
    .eq("contact_email", email)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (distributorError) throw new Error(`Distributor profile lookup failed: ${distributorError.message}`);
  if (!distributor) throw new Error("Active distributor profile is required before checkout.");

  return { supabase, distributor: distributor as DbRecord };
}

function getFreightCharge(body: CheckoutBody) {
  const freightCharge = Number(body.freightCharge ?? 0);
  if (!Number.isFinite(freightCharge) || freightCharge < 0) return 0;
  return Math.round(freightCharge * 100) / 100;
}

function validateBolFile(file: File | null) {
  if (!file) throw new Error("BOL upload is required when arranging your own freight.");
  if (file.size <= 0) throw new Error("BOL upload file is empty.");
  if (file.size > MAX_BOL_SIZE_BYTES) throw new Error("BOL file is too large. Maximum size is 15 MB.");
  if (file.type && !ALLOWED_BOL_TYPES.has(file.type)) throw new Error("BOL must be a PDF, JPG, or PNG file.");
}

function validateBody(body: CheckoutBody, bolFile: File | null) {
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  if (!body.email || !body.email.includes("@")) throw new Error("A valid receipt email is required.");
  if (!clean(body.warrantyCustomerName)) throw new Error("Customer name is required for warranty records.");
  if (!clean(body.warrantyCustomerPhone)) throw new Error("Customer phone is required for warranty records.");
  const warrantyEmail = clean(body.warrantyCustomerEmail);
  if (!warrantyEmail || !warrantyEmail.includes("@")) throw new Error("Customer email is required for warranty records.");

  const shippingMethod = body.shippingMethod ?? "echo";
  const missingShipTo = [body.shipToName, body.shipToAddress, body.shipToCity, body.shipToState, body.shipToZip].some((value) => !value?.trim());
  if (missingShipTo) throw new Error("Ship-to name, address, city, state, and ZIP are required.");

  if (shippingMethod === "echo") {
    if (!clean(body.deliveryType)) throw new Error("Delivery location type is required before checkout.");
    if (!clean(body.liftgateRequired)) throw new Error("Liftgate selection is required before checkout.");
    if (!clean(body.selectedRate)) throw new Error("A freight option is required before checkout.");
    if (getFreightCharge(body) <= 0) throw new Error("Selected freight charge is required before checkout.");
  }

  if (shippingMethod === "own") validateBolFile(bolFile);
  return quantity;
}

function warrantyNote(body: CheckoutBody, unitPrice: number) {
  return [
    "Warranty customer information:",
    `Name: ${clean(body.warrantyCustomerName) || "Not set"}`,
    `Email: ${clean(body.warrantyCustomerEmail) || "Not set"}`,
    `Phone: ${clean(body.warrantyCustomerPhone) || "Not set"}`,
    `Delivery type: ${clean(body.deliveryType) || "Not set"}`,
    `Liftgate required: ${clean(body.liftgateRequired) || "Not set"}`,
    `Shipping method: ${body.shippingMethod === "own" ? "Distributor-arranged freight" : "Cattle Guard Forms freight quote"}`,
    `Distributor unit price: $${unitPrice.toFixed(2)}`,
    body.shippingMethod === "own" ? `BOL file: ${clean(body.bolFileName) || "Attached after payment"}` : "",
  ].filter(Boolean).join("\n");
}

async function upsertWarrantyCustomer(input: { supabase: ReturnType<typeof createSupabaseAdminClient>; body: CheckoutBody; distributorName: string }) {
  const email = clean(input.body.warrantyCustomerEmail).toLowerCase();
  const name = clean(input.body.warrantyCustomerName);
  const { firstName, lastName } = splitName(name);
  const customerData = {
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    phone: clean(input.body.warrantyCustomerPhone) || null,
    company: clean(input.body.shipToName) || clean(input.distributorName) || null,
    address_line1: clean(input.body.shipToAddress) || null,
    address_line2: clean(input.body.shipToAddress2) || null,
    city: clean(input.body.shipToCity) || null,
    state: clean(input.body.shipToState) || null,
    postal_code: clean(input.body.shipToZip) || null,
  };

  const { data: existing, error: lookupError } = await input.supabase.from("customers").select("id").eq("email", email).maybeSingle();
  if (lookupError) throw new Error(`Warranty customer lookup failed: ${lookupError.message}`);

  if (existing?.id) {
    const { error } = await input.supabase.from("customers").update(customerData).eq("id", existing.id);
    if (error) throw new Error(`Warranty customer update failed: ${error.message}`);
    return clean(existing.id);
  }

  const { data, error } = await input.supabase.from("customers").insert(customerData).select("id").single();
  if (error || !data?.id) throw new Error(`Warranty customer create failed: ${error?.message || "missing customer id"}`);
  return clean(data.id);
}

async function createPendingOrder(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  distributorId: string;
  distributorName: string;
  distributorEmail: string;
  customerId: string;
  body: CheckoutBody;
  quantity: number;
  unitPrice: number;
}) {
  const freightCharge = getFreightCharge(input.body);
  const total = input.quantity * input.unitPrice + freightCharge;
  const now = new Date().toISOString();
  const shippingMethod = input.body.shippingMethod ?? "echo";
  const palletPlan = getPalletPlan(input.quantity);
  const contactEmail = clean(input.body.email).toLowerCase() || clean(input.distributorEmail).toLowerCase();
  const contactName = clean(input.body.distributorAccountName) || input.distributorName;
  const customerName = clean(input.body.warrantyCustomerName);
  const customerEmail = clean(input.body.warrantyCustomerEmail).toLowerCase();
  const customerPhone = clean(input.body.warrantyCustomerPhone);
  const deliveryType = clean(input.body.deliveryType);

  const { data, error } = await input.supabase
    .from("orders")
    .insert({
      customer_id: input.customerId,
      order_type: "distributor",
      product_name: "CowStop Reusable Form",
      product_status: "active",
      cowstop_quantity: input.quantity,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      total,
      payment_status: "pending",
      checkout_status: "created",
      shipment_status: "pending",
      shipping_method: shippingMethod,
      distributor_profile_id: input.distributorId,
      raw_vendor_name: input.distributorName,
      normalized_vendor_name: input.distributorName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: clean(input.body.contactPhone),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      warranty_customer_name: customerName,
      warranty_customer_email: customerEmail,
      warranty_customer_phone: customerPhone,
      ship_to_name: clean(input.body.shipToName),
      ship_to_address: clean(input.body.shipToAddress),
      ship_to_address_2: clean(input.body.shipToAddress2),
      ship_to_city: clean(input.body.shipToCity),
      ship_to_state: clean(input.body.shipToState),
      ship_to_zip: clean(input.body.shipToZip),
      project_address_line1: clean(input.body.shipToAddress),
      project_city: clean(input.body.shipToCity),
      project_state: clean(input.body.shipToState),
      project_postal_code: clean(input.body.shipToZip),
      delivery_type: deliveryType,
      delivery_location_type: deliveryType,
      liftgate_required: clean(input.body.liftgateRequired),
      selected_rate: clean(input.body.selectedRate),
      selected_freight_carrier: clean(input.body.selectedRate),
      freight_charge: freightCharge,
      pallet_count: palletPlan.palletCount,
      pallet_length_in: palletPlan.length,
      pallet_width_in: palletPlan.width,
      pallet_height_in: palletPlan.height,
      pallet_weight_lbs: palletPlan.weight,
      bol_file: clean(input.body.bolFileName) || null,
      manufacturer_notes: warrantyNote(input.body, input.unitPrice),
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Unable to create distributor order before checkout: ${error.message}`);
  const orderId = clean(data?.id);
  if (!orderId) throw new Error("Distributor order was created without an order ID.");

  const { error: activityError } = await input.supabase.from("crm_activity").insert({
    activity_type: "distributor_checkout_started",
    title: `Distributor checkout started for warranty customer ${customerName}`,
    description: `${input.distributorName} started checkout for ${input.quantity} CowStop form(s) at $${input.unitPrice.toFixed(2)} each. Warranty customer: ${customerName}, ${customerEmail}, ${customerPhone}.`,
    order_id: orderId,
    source: "distributor_checkout",
    status: "open",
  });

  if (activityError) console.warn("Unable to create distributor warranty customer CRM activity", activityError.message);
  return orderId;
}

async function saveBolFile(input: { supabase: ReturnType<typeof createSupabaseAdminClient>; orderId: string; file: File }) {
  const filename = safeFilename(input.file.name);
  const storagePath = `${input.orderId}/original_bol/${Date.now()}-${filename}`;
  const content = Buffer.from(await input.file.arrayBuffer());
  const { error: uploadError } = await input.supabase.storage.from(ORDER_FILES_BUCKET).upload(storagePath, content, { contentType: input.file.type || "application/octet-stream", upsert: false });
  if (uploadError) throw new Error(`BOL file upload failed: ${uploadError.message}`);
  const { error: insertError } = await input.supabase.from("order_files").insert({ order_id: input.orderId, file_type: "original_bol", file_name: filename, storage_path: storagePath, content_type: input.file.type || null, size_bytes: input.file.size, uploaded_by_role: "distributor" });
  if (insertError) throw new Error(`BOL file metadata insert failed: ${insertError.message}`);
  return { filename, contentType: input.file.type || undefined };
}

async function attachStripeSession(input: { supabase: ReturnType<typeof createSupabaseAdminClient>; orderId: string; sessionId: string }) {
  const { error } = await input.supabase.from("orders").update({ stripe_checkout_session_id: input.sessionId, checkout_status: "created", updated_at: new Date().toISOString() }).eq("id", input.orderId);
  if (error) throw new Error(`Unable to attach Stripe session to order: ${error.message}`);
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Checkout is not available right now." }, { status: 500 });

  try {
    const { body, bolFile } = await readCheckoutInput(request);
    const quantity = validateBody(body, bolFile);
    const { supabase, distributor } = await requireDistributor(request);
    const unitPrice = distributorUnitPrice(distributor);
    const distributorName = clean(distributor.company_name) || clean(body.distributorAccountName) || "Approved Distributor";
    const orderContactEmail = clean(body.email).toLowerCase();
    const distributorEmail = clean(distributor.contact_email) || orderContactEmail;
    const shippingMethod = body.shippingMethod ?? "echo";
    const palletPlan = getPalletPlan(quantity);
    const customerId = await upsertWarrantyCustomer({ supabase, body, distributorName });

    const orderId = await createPendingOrder({ supabase, distributorId: clean(distributor.id), distributorName, distributorEmail, customerId, body, quantity, unitPrice });

    let bolFileName = clean(body.bolFileName);
    if (shippingMethod === "own" && bolFile) {
      const savedBol = await saveBolFile({ supabase, orderId, file: bolFile });
      bolFileName = savedBol.filename;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = getBaseUrl(request);
    const freightCharge = getFreightCharge(body);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: orderContactEmail || distributorEmail,
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: unitAmountFromPrice(unitPrice),
            product_data: { name: "CowStop Reusable Form - Distributor Rate", description: `Distributor online order for CowStop reusable cattle guard forms at $${unitPrice.toFixed(2)} each.` },
          },
        },
        ...(freightCharge > 0 ? [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(freightCharge * 100), product_data: { name: "Freight & Handling", description: clean(body.selectedRate) || "Selected freight option." } } }] : []),
      ],
      metadata: {
        orderId,
        customer_id: customerId,
        order_type: "distributor",
        distributor_profile_id: clean(distributor.id),
        distributor_account_name: distributorName,
        distributor_contact_email: distributorEmail,
        warranty_customer_name: clean(body.warrantyCustomerName),
        warranty_customer_email: clean(body.warrantyCustomerEmail),
        warranty_customer_phone: clean(body.warrantyCustomerPhone),
        delivery_type: clean(body.deliveryType),
        delivery_location_type: clean(body.deliveryType),
        liftgate_required: clean(body.liftgateRequired),
        pallet_count: String(palletPlan.palletCount),
        pallet_length_in: String(palletPlan.length),
        pallet_width_in: String(palletPlan.width),
        pallet_height_in: String(palletPlan.height),
        pallet_weight_lbs: String(palletPlan.weight),
        quantity: String(quantity),
        unit_price: unitPrice.toFixed(2),
        shipping_method: shippingMethod,
        ship_to_name: body.shipToName ?? "",
        ship_to_address: body.shipToAddress ?? "",
        ship_to_city: body.shipToCity ?? "",
        ship_to_state: body.shipToState ?? "",
        ship_to_zip: body.shipToZip ?? "",
        contact_phone: body.contactPhone ?? "",
        selected_rate: body.selectedRate ?? "",
        freight_charge: String(freightCharge),
        bol_file_name: bolFileName,
      },
      success_url: `${baseUrl}/distributor/home?checkout=success&order=${orderId}`,
      cancel_url: `${baseUrl}/distributor/shop?checkout=cancelled&order=${orderId}`,
    });

    await attachStripeSession({ supabase, orderId, sessionId: session.id });
    return NextResponse.json({ url: session.url, orderId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start distributor checkout right now." }, { status: 400 });
  }
}
