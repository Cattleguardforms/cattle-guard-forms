import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendSupportRequestEmails } from "@/lib/email/resend";
import type { SupportRequestPayload } from "@/lib/email/templates/confirmation-workflow";

type SupportRequestBody = SupportRequestPayload;

type CustomerRecord = {
  id?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function findCustomerIdByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Customer lookup failed: ${error.message}`);
  return ((data ?? {}) as CustomerRecord).id ?? null;
}

async function createSupportRequest(payload: SupportRequestBody, customerId: string | null) {
  const supabase = createSupabaseAdminClient();
  const orderId = clean(payload.orderId);
  const { data, error } = await supabase
    .from("support_requests")
    .insert({
      order_id: orderId || null,
      customer_id: customerId,
      name: clean(payload.name) || null,
      email: clean(payload.email).toLowerCase(),
      phone: clean(payload.phone) || null,
      company: clean(payload.company) || null,
      topic: clean(payload.topic) || "General support",
      message: clean(payload.message) || null,
      source: clean(payload.source) || "website_support_form",
      matched_by: customerId ? "email" : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Support request create failed: ${error.message}`);
  return String((data as { id: string }).id);
}

async function createCrmActivity(payload: SupportRequestBody, supportId: string, customerId: string | null) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("crm_activity").insert({
    activity_type: "support_request",
    title: `Support request: ${clean(payload.topic) || "General support"}`,
    description: clean(payload.message) || "Support request received.",
    customer_id: customerId,
    order_id: clean(payload.orderId) || null,
    source: clean(payload.source) || "website_support_form",
    status: "open",
    metadata: { support_request_id: supportId },
  });

  if (error) throw new Error(`CRM activity create failed: ${error.message}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SupportRequestBody;
    const email = clean(body.email).toLowerCase();

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Valid email is required." }, { status: 400 });
    }

    const customerId = await findCustomerIdByEmail(email);
    const supportId = await createSupportRequest({ ...body, email }, customerId);
    await createCrmActivity({ ...body, email }, supportId, customerId);

    await sendSupportRequestEmails({ ...body, email, supportId });

    return NextResponse.json({ ok: true, supportId, customerId });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Support request failed." },
      { status: 500 }
    );
  }
}
