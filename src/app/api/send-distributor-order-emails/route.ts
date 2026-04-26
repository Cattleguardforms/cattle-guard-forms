import { NextResponse } from "next/server";
import { sendDistributorOrderEmails, type DistributorOrderEmailPayload } from "@/lib/email/resend";

function validatePayload(payload: Partial<DistributorOrderEmailPayload>) {
  if (!payload.distributorAccountName) return "Distributor account name is required.";
  if (!payload.email || !payload.email.includes("@")) return "Valid distributor email is required.";
  if (!Number.isInteger(Number(payload.quantity)) || Number(payload.quantity) < 1) {
    return "Quantity must be at least 1.";
  }

  if (payload.shippingMethod === "own") {
    if (!payload.bolFileName) return "BOL filename is required when shipping on your own.";
    return null;
  }

  const missingEchoShipping = [
    payload.shipToName,
    payload.shipToAddress,
    payload.shipToCity,
    payload.shipToState,
    payload.shipToZip,
    payload.selectedRate,
  ].some((value) => !value?.trim());

  if (missingEchoShipping) {
    return "Ship-to name, address, and selected rate are required for Cattle Guard Forms shipping.";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DistributorOrderEmailPayload;
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    // TODO: This route is for backend testing only. In production, sendDistributorOrderEmails
    // should be triggered by the Stripe webhook after checkout.session.completed confirms payment.
    const result = await sendDistributorOrderEmails(payload);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send distributor order emails.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
