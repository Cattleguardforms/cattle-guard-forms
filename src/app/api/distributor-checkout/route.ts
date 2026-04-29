import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendDistributorOrderEmails } from "@/lib/email/resend";

export const runtime = "nodejs";

const DISTRIBUTOR_UNIT_AMOUNT = 75000;
const DISTRIBUTOR_UNIT_PRICE = 750;
const MAX_QUANTITY = 50;
const ORDER_FILES_BUCKET = "order-files";
const MAX_BOL_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_BOL_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

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

function safeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120);
  return cleaned || "bol-file";
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
  if (!profile || profile.role !== "distributor" || profile.status !== "active") {
    throw new Error("Approved distributor role is required before checkout.");
  }

  const { data: distributor, error: distributorError } = await supabase
    .from("distributor_profiles")
    .select("id, user_id, company_name, contact_email, status, price_per_unit")
    .eq("contact_email", email)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (distributorError) throw new Error(`Distributor profile lookup failed: ${distributorError.message}`);
  if (!distributor) throw new Error("Active distributor profile is required before checkout.");

  return { supabase, distributor };
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
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }

  if (!body.email || !body.email.includes("@")) throw new Error("A valid receipt email is required.");
  if (!clean(body.warrantyCustomerName)) throw new Error("Customer name is required for warranty records.");
  if (!clean(body.warrantyCustomerPhone)) throw new Error("Customer phone is required for warranty records.");

  const shippingMethod = body.shippingMethod ?? "echo";
  const missingShipTo = [body.shipToName, body.shipToAddress, body.shipToCity, body.shipToState, body.shipToZip].some((value) => !value?.trim());
  if (missingShipTo) throw new Error("Ship-to name, address, city, state, and ZIP are required.");

  if (shippingMethod === "echo") {
    if (!clean(body.selectedRate)) throw new Error("A freight option is required before checkout.");
    if (getFreightCharge(body) <= 0) throw new Error("Selected freight charge is required before checkout.");
  }

  if (shippingMethod === "own") validateBolFile(bolFile);
  return quantity;
}

function warrantyNote(body: CheckoutBody) {
  return [
    "Warranty customer information:",
    `Name: ${clean(body.warrantyCustomerName) || "Not set"}`,
    `Email: ${clean(body.warrantyCustomerEmail) || "Not set"}`,
    `Phone: ${clean(body.warrantyCustomerPhone) || "Not set"}`,
    `Shipping method: ${body.shippingMethod === "own" ? "Distributor-arranged freight" : "Cattle Guard Forms freight quote"}`,
    body.shippingMethod === "own" ? `BOL file: ${clean(body.bolFileName) || "Attached"}` : "",
  ].filter(Boolean).join("\n");
}

async function createPendingOrder(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  distributorId: string;
  distributorName: string;
  distributorEmail: string;
  orderContactEmail: string;
  body: CheckoutBody;
  quantity: number;
}) {
  const freightCharge = getFreightCharge(input.body);
  const total = input.quantity * DISTRIBUTOR_UNIT_PRICE + freightCharge;
  const now = new Date().toISOString();
  const shippingMethod = input.body.shippingMethod ?? "echo";

  const { data, error } = await input.supabase
    .from("orders")
    .insert({
      order_type: "distributor",
      product_name: "CowStop Reusable Form",
      product_status: "active",
      cowstop_quantity: input.quantity,
      quantity: input.quantity,
      unit_price: DISTRIBUTOR_UNIT_PRICE,
      total,
      payment_status: "pending",
      checkout_status: "created",
      shipment_status: "pending",
      shipping_method: shippingMethod,
      distributor_profile_id: input.distributorId,
      raw_vendor_name: input.distributorName,
      normalized_vendor_name: input.distributorName,
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
      contact_phone: clean(input.body.contactPhone),
      delivery_type: clean(input.body.deliveryType),
      liftgate_required: clean(input.body.liftgateRequired),
      selected_rate: clean(input.body.selectedRate),
      freight_charge: freightCharge,
      bol_file: clean(input.body.bolFileName) || null,
      manufacturer_notes: warrantyNote(input.body),
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Unable to create distributor order before checkout: ${error.message}`);
  const orderId = clean(data?.id);
  if (!orderId) throw new Error("Distributor order was created without an order ID.");
  return orderId;
}

async function saveBolFile(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  orderId: string;
  file: File;
}) {
  const filename = safeFilename(input.file.name);
  const storagePath = `${input.orderId}/original_bol/${Date.now()}-${filename}`;
  const arrayBuffer = await input.file.arrayBuffer();
  const content = Buffer.from(arrayBuffer);

  const { error: uploadError } = await input.supabase.storage
    .from(ORDER_FILES_BUCKET)
    .upload(storagePath, content, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw new Error(`BOL file upload failed: ${uploadError.message}`);

  const { error: insertError } = await input.supabase.from("order_files").insert({
    order_id: input.orderId,
    file_type: "original_bol",
    file_name: filename,
    storage_path: storagePath,
    content_type: input.file.type || null,
    size_bytes: input.file.size,
    uploaded_by_role: "distributor",
  });

  if (insertError) throw new Error(`BOL file metadata insert failed: ${insertError.message}`);
  return { filename, content, contentType: input.file.type || undefined };
}

async function attachStripeSession(input: { supabase: ReturnType<typeof createSupabaseAdminClient>; orderId: string; sessionId: string }) {
  const now = new Date().toISOString();
  const { error } = await input.supabase
    .from("orders")
    .update({ stripe_checkout_session_id: input.sessionId, checkout_status: "created", updated_at: now })
    .eq("id", input.orderId);
  if (error) throw new Error(`Unable to attach Stripe session to order: ${error.message}`);
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Checkout is not available right now." }, { status: 500 });

  try {
    const { body, bolFile } = await readCheckoutInput(request);
    const quantity = validateBody(body, bolFile);
    const { supabase, distributor } = await requireDistributor(request);
    const distributorName = clean(distributor.company_name) || clean(body.distributorAccountName) || "Approved Distributor";
    const orderContactEmail = clean(body.email).toLowerCase();
    const distributorEmail = clean(distributor.contact_email) || orderContactEmail;
    const shippingMethod = body.shippingMethod ?? "echo";

    const orderId = await createPendingOrder({
      supabase,
      distributorId: clean(distributor.id),
      distributorName,
      distributorEmail,
      orderContactEmail,
      body,
      quantity,
    });

    let bolAttachment: { filename: string; content: Buffer; contentType?: string } | undefined;
    if (shippingMethod === "own" && bolFile) {
      bolAttachment = await saveBolFile({ supabase, orderId, file: bolFile });
      await sendDistributorOrderEmails({
        orderId,
        distributorAccountName: distributorName,
        email: distributorEmail,
        customerName: clean(body.warrantyCustomerName),
        customerEmail: clean(body.warrantyCustomerEmail),
        quantity,
        shippingMethod,
        shipToName: clean(body.shipToName),
        shipToAddress: clean(body.shipToAddress),
        shipToAddress2: clean(body.shipToAddress2),
        shipToCity: clean(body.shipToCity),
        shipToState: clean(body.shipToState),
        shipToZip: clean(body.shipToZip),
        selectedRate: "Distributor-arranged freight",
        bolFileName: bolAttachment.filename,
        bolAttachment,
        orderNotes: warrantyNote(body),
      });
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
            unit_amount: DISTRIBUTOR_UNIT_AMOUNT,
            product_data: {
              name: "CowStop Reusable Form - Distributor Rate",
              description: "Distributor online order for CowStop reusable cattle guard forms.",
            },
          },
        },
        ...(freightCharge > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: Math.round(freightCharge * 100),
                  product_data: { name: "Freight & Handling", description: clean(body.selectedRate) || "Selected freight option." },
                },
              },
            ]
          : []),
      ],
      metadata: {
        orderId,
        order_type: "distributor",
        distributor_profile_id: clean(distributor.id),
        distributor_account_name: distributorName,
        distributor_contact_email: distributorEmail,
        warranty_customer_name: clean(body.warrantyCustomerName),
        warranty_customer_email: clean(body.warrantyCustomerEmail),
        warranty_customer_phone: clean(body.warrantyCustomerPhone),
        quantity: String(quantity),
        unit_price: "750.00",
        shipping_method: shippingMethod,
        ship_to_name: body.shipToName ?? "",
        ship_to_address: body.shipToAddress ?? "",
        ship_to_city: body.shipToCity ?? "",
        ship_to_state: body.shipToState ?? "",
        ship_to_zip: body.shipToZip ?? "",
        contact_phone: body.contactPhone ?? "",
        selected_rate: body.selectedRate ?? "",
        freight_charge: String(freightCharge),
        bol_file_name: bolAttachment?.filename ?? body.bolFileName ?? "",
      },
      success_url: `${baseUrl}/distributor/portal?checkout=success&order=${orderId}`,
      cancel_url: `${baseUrl}/distributor/portal?checkout=cancelled&order=${orderId}`,
    });

    await attachStripeSession({ supabase, orderId, sessionId: session.id });
    return NextResponse.json({ url: session.url, orderId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start distributor checkout right now." }, { status: 400 });
  }
}
