import { NextResponse } from "next/server";
import { createCrmOrder, upsertCrmContact } from "@/lib/crm/intake";

type MarketingEmailPayload = {
  recipientEmail?: string;
  recipientName?: string;
  recipientCompany?: string;
  subject?: string;
  campaign?: string;
  status?: string;
  sendDate?: string;
  body?: string;
  notes?: string;
};

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(request: Request) {
  let body: MarketingEmailPayload;

  try {
    body = (await request.json()) as MarketingEmailPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const email = clean(body.recipientEmail);
  const subject = clean(body.subject);
  const emailBody = clean(body.body);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "A valid recipient email is required." }, { status: 400 });
  }

  if (!subject) {
    return NextResponse.json({ ok: false, error: "Email subject is required." }, { status: 400 });
  }

  if (!emailBody) {
    return NextResponse.json({ ok: false, error: "Email body is required." }, { status: 400 });
  }

  const [firstName, ...lastNameParts] = (clean(body.recipientName) || "").split(" ").filter(Boolean);

  const { customerId, error: contactError } = await upsertCrmContact({
    email,
    firstName,
    lastName: lastNameParts.join(" ") || undefined,
    company: clean(body.recipientCompany),
    notes: [
      "CRM Source: Marketing Email Activity",
      body.campaign ? `Campaign: ${body.campaign}` : undefined,
      body.status ? `Status: ${body.status}` : undefined,
      body.sendDate ? `Send Date: ${body.sendDate}` : undefined,
      body.notes ? `Notes: ${body.notes}` : undefined,
    ].filter(Boolean).join("\n"),
    source: "marketing_email",
  });

  if (contactError || !customerId) {
    return NextResponse.json({ ok: false, error: contactError || "Unable to upsert CRM contact." }, { status: 500 });
  }

  const { orderId, status, error: orderError } = await createCrmOrder({
    customerId,
    productName: subject,
    productType: "Marketing Email Activity",
    quantity: 1,
    status: clean(body.status) || "email_draft",
    notes: [
      "CRM Source: Marketing Email Activity",
      `Subject: ${subject}`,
      body.campaign ? `Campaign: ${body.campaign}` : undefined,
      body.sendDate ? `Send Date: ${body.sendDate}` : undefined,
      "",
      "Email Body:",
      emailBody,
      body.notes ? `\nNotes:\n${body.notes}` : undefined,
    ].filter(Boolean).join("\n"),
  });

  if (orderError) {
    return NextResponse.json({ ok: false, error: orderError }, { status: 500 });
  }

  return NextResponse.json({ ok: true, customer_id: customerId, order_id: orderId, status }, { status: 201 });
}
