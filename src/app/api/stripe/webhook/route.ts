import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendDistributorOrderEmails } from "@/lib/email/resend";

export const runtime = "nodejs";

type LooseRecord = Record<string, unknown>;

type BolAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function centsToDollars(value: number | null | undefined) {
  return typeof value === "number" ? value / 100 : null;
}

function stripeId(value: string | Stripe.PaymentIntent | Stripe.Customer | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function findOrder(orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();

  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!data) throw new Error(`No order found for Stripe metadata orderId ${orderId}.`);

  return data as LooseRecord;
}

async function findCustomer(order: LooseRecord) {
  const customerId = clean(order.customer_id);
  if (!customerId) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).maybeSingle();

  if (error) throw new Error(`Customer lookup failed: ${error.message}`);
  return (data ?? null) as LooseRecord | null;
}

async function findDistributor(order: LooseRecord) {
  const distributorProfileId = clean(order.distributor_profile_id);
  if (!distributorProfileId) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("distributor_profiles")
    .select("*")
    .eq("id", distributorProfileId)
    .maybeSingle();

  if (error) throw new Error(`Distributor lookup failed: ${error.message}`);
  return (data ?? null) as LooseRecord | null;
}

async function findOriginalBolAttachment(orderId: string): Promise<BolAttachment | undefined> {
  const supabase = createSupabaseAdminClient();
  const { data: fileRecord, error } = await supabase
    .from("order_files")
    .select("file_name, storage_path, content_type")
    .eq("order_id", orderId)
    .eq("file_type", "original_bol")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Paid PO BOL lookup skipped", error.message);
    return undefined;
  }

  const storagePath = clean(fileRecord?.storage_path);
  if (!storagePath) return undefined;

  const { data: blob, error: downloadError } = await supabase.storage.from("order-files").download(storagePath);
  if (downloadError || !blob) {
    console.warn("Paid PO BOL download skipped", downloadError?.message);
    return undefined;
  }

  const arrayBuffer = await blob.arrayBuffer();
  return {
    filename: clean(fileRecord?.file_name) || "customer-bol.pdf",
    content: Buffer.from(arrayBuffer),
    contentType: clean(fileRecord?.content_type) || undefined,
  };
}

async function createCrmActivity(input: {
  title: string;
  description: string;
  orderId?: string | null;
  customerId?: string | null;
  distributorProfileId?: string | null;
  status?: string;
}) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("crm_activity").insert({
      activity_type: "stripe_payment",
      title: input.title,
      description: input.description,
      order_id: input.orderId ?? null,
      customer_id: input.customerId ?? null,
      distributor_profile_id: input.distributorProfileId ?? null,
      source: "stripe_webhook",
      status: input.status ?? "closed",
    });

    if (error) console.warn("Stripe webhook CRM activity skipped", error.message);
  } catch (error) {
    console.warn("Stripe webhook CRM activity skipped", error);
  }
}

async function markOrderPaid(session: Stripe.Checkout.Session, orderId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const paymentIntentId = stripeId(session.payment_intent as string | Stripe.PaymentIntent | null | undefined);
  const amountPaid = centsToDollars(session.amount_total ?? session.amount_subtotal ?? null);

  const { error: requiredError } = await supabase
    .from("orders")
    .update({
      status: "ready_for_fulfillment",
      payment_status: "paid",
      updated_at: now,
    })
    .eq("id", orderId);

  if (requiredError) {
    throw new Error(`Required paid order update failed: ${requiredError.message}`);
  }

  const { error: optionalError } = await supabase
    .from("orders")
    .update({
      shipment_status: "ready_for_fulfillment",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount_paid: amountPaid,
      currency: session.currency ?? "usd",
      paid_at: now,
      checkout_status: session.status ?? "complete",
      payment_failure_message: null,
      updated_at: now,
    })
    .eq("id", orderId);

  if (optionalError) {
    console.warn("Optional Stripe paid order fields skipped", optionalError.message);
  }
}

async function markOrderPaymentFailed(paymentIntent: Stripe.PaymentIntent, orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "failed", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(`Required failed-payment order update failed: ${error.message}`);
}

function buildShipTo(order: LooseRecord, customer: LooseRecord | null) {
  return {
    shipToName:
      clean(order.ship_to_name) ||
      clean(order.customer_name) ||
      clean(customer?.customer_name) ||
      [clean(customer?.first_name), clean(customer?.last_name)].filter(Boolean).join(" ") ||
      clean(customer?.company) ||
      clean(customer?.company_name) ||
      undefined,
    shipToAddress: clean(order.ship_to_address) || clean(order.project_address_line1) || clean(customer?.address_line1) || clean(customer?.address) || undefined,
    shipToAddress2: clean(order.ship_to_address2) || clean(order.project_address_line2) || clean(customer?.address_line2) || undefined,
    shipToCity: clean(order.ship_to_city) || clean(order.project_city) || clean(customer?.city) || undefined,
    shipToState: clean(order.ship_to_state) || clean(order.project_state) || clean(customer?.state) || undefined,
    shipToZip: clean(order.ship_to_zip) || clean(order.project_postal_code) || clean(customer?.postal_code) || clean(customer?.zip) || undefined,
  };
}

async function sendPaymentWorkflowEmails(session: Stripe.Checkout.Session, order: LooseRecord) {
  const orderId = clean(order.id) || clean(session.metadata?.orderId);
  const customer = await findCustomer(order);
  const distributor = await findDistributor(order);
  const email =
    clean(distributor?.contact_email) ||
    clean(order.email) ||
    clean(order.customer_email) ||
    clean(customer?.email) ||
    clean(session.customer_details?.email) ||
    clean(session.customer_email);

  if (!email) return;

  const quantity = Number(order.cowstop_quantity ?? order.quantity ?? session.metadata?.quantity ?? 1) || 1;
  const distributorAccountName =
    clean(distributor?.company_name) ||
    clean(order.normalized_vendor_name) ||
    clean(order.raw_vendor_name) ||
    clean(customer?.company_name) ||
    clean(customer?.company) ||
    "Cattle Guard Forms Customer";
  const customerName =
    clean(session.metadata?.warranty_customer_name) ||
    clean(order.customer_name) ||
    clean(customer?.customer_name) ||
    [clean(customer?.first_name), clean(customer?.last_name)].filter(Boolean).join(" ") ||
    clean(customer?.company) ||
    clean(customer?.company_name) ||
    undefined;
  const customerEmail =
    clean(session.metadata?.warranty_customer_email) ||
    clean(customer?.email) ||
    clean(session.customer_details?.email) ||
    undefined;
  const bolAttachment = orderId ? await findOriginalBolAttachment(orderId) : undefined;

  await sendDistributorOrderEmails({
    orderId,
    distributorAccountName,
    email,
    customerName,
    customerEmail,
    quantity,
    shippingMethod: clean(order.shipping_method) || clean(session.metadata?.shipping_method) || "echo",
    ...buildShipTo(order, customer),
    selectedRate: clean(order.selected_rate) || clean(session.metadata?.selected_rate) || undefined,
    bolFileName: clean(order.bol_file) || clean(session.metadata?.bol_file_name) || bolAttachment?.filename || undefined,
    bolAttachment,
    orderNotes: clean(order.manufacturer_notes) || clean(order.notes) || clean(order.admin_notes) || undefined,
    stripeSessionId: session.id,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = clean(session.metadata?.orderId);
  if (!orderId) throw new Error("Stripe checkout.session.completed is missing metadata.orderId.");

  await markOrderPaid(session, orderId);

  try {
    const order = await findOrder(orderId);
    await createCrmActivity({
      title: `Stripe payment completed for order ${orderId}`,
      description: `Checkout session ${session.id} completed. Payment intent: ${stripeId(session.payment_intent as string | Stripe.PaymentIntent | null | undefined) ?? "not provided"}.`,
      orderId,
      customerId: clean(order.customer_id) || null,
      distributorProfileId: clean(order.distributor_profile_id) || null,
    });

    try {
      await sendPaymentWorkflowEmails(session, order);
    } catch (error) {
      console.warn("Stripe webhook payment email workflow skipped", error);
      await createCrmActivity({
        title: `Payment email workflow needs review for order ${orderId}`,
        description: error instanceof Error ? error.message : "Unable to send payment workflow emails.",
        orderId,
        customerId: clean(order.customer_id) || null,
        distributorProfileId: clean(order.distributor_profile_id) || null,
        status: "open",
      });
    }
  } catch (error) {
    console.warn("Stripe webhook optional post-payment workflow skipped", error);
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid Stripe webhook signature." },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = clean(paymentIntent.metadata?.orderId);
      if (orderId) await markOrderPaymentFailed(paymentIntent, orderId);
    }

    return NextResponse.json({ ok: true, received: true, eventType: event.type });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Stripe webhook handler failed." },
      { status: 500 },
    );
  }
}
