import { NextResponse } from "next/server";
import { createCrmOrder, upsertCrmContact } from "@/lib/crm/intake";

type ContactPayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  subject?: string;
  message?: string;
};

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const email = clean(body.email);
  const message = clean(body.message);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
  }

  const { customerId, error: contactError } = await upsertCrmContact({
    email,
    firstName: clean(body.first_name),
    lastName: clean(body.last_name),
    phone: clean(body.phone),
    company: clean(body.company),
    notes: message,
    source: "contact_form",
  });

  if (contactError || !customerId) {
    return NextResponse.json({ ok: false, error: contactError || "Unable to create CRM contact." }, { status: 500 });
  }

  const { orderId, status, error: orderError } = await createCrmOrder({
    customerId,
    productName: clean(body.subject) || "Contact Form Inquiry",
    productType: "Contact Inquiry",
    quantity: 1,
    status: "contacted_pending_review",
    notes: [
      "CRM Source: Contact Form",
      body.subject ? `Subject: ${body.subject}` : "Subject: General inquiry",
      "",
      message,
    ].join("\n"),
  });

  if (orderError) {
    return NextResponse.json({ ok: false, error: orderError }, { status: 500 });
  }

  return NextResponse.json({ ok: true, customer_id: customerId, order_id: orderId, status }, { status: 201 });
}
