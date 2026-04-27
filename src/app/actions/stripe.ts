"use server";

import { stripe } from "@/lib/stripe/server";
import { COWSTOP_PRODUCT_NAME, getCowStopCheckoutAmountCents } from "@/lib/stripe/pricing";

type CheckoutInput = {
  orderId: string;
  productId?: string;
  quantity?: number;
  customerEmail?: string;
};

export async function startCheckoutSession(input: CheckoutInput) {
  const quantity = Math.min(20, Math.max(1, Math.floor(input.quantity || 1)));
  const amount = getCowStopCheckoutAmountCents(quantity);

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer_email: input.customerEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: COWSTOP_PRODUCT_NAME,
            description: `${quantity} CowStop reusable concrete cattle guard form${quantity === 1 ? "" : "s"}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      orderId: input.orderId,
      productId: input.productId || "cowstop",
      quantity: String(quantity),
    },
  });

  if (!session.client_secret) {
    throw new Error("Stripe did not return an embedded checkout client secret.");
  }

  return session.client_secret;
}
