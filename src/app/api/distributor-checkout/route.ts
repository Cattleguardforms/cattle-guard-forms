import { NextResponse } from "next/server";
import Stripe from "stripe";

const DISTRIBUTOR_UNIT_AMOUNT = 75000;
const MAX_QUANTITY = 50;

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY before accepting distributor payments." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    quantity?: number;
    email?: string;
    company?: string;
    contactName?: string;
  };

  const quantity = Number(body.quantity);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return NextResponse.json(
      { error: `Quantity must be between 1 and ${MAX_QUANTITY}.` },
      { status: 400 },
    );
  }

  if (!body.email || !body.email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const baseUrl = getBaseUrl(request);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: body.email,
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
      order_type: "distributor",
      contact_name: body.contactName ?? "",
      company: body.company ?? "",
      quantity: String(quantity),
      unit_price: "750.00",
    },
    success_url: `${baseUrl}/distributor?checkout=success`,
    cancel_url: `${baseUrl}/distributor?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
