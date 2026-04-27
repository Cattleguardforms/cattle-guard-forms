"use client";

import { useCallback } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { startCheckoutSession } from "@/app/actions/stripe";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type CheckoutProps = {
  orderId: string;
  productId?: string;
  quantity?: number;
  customerEmail?: string;
};

export default function Checkout({ orderId, productId = "cowstop", quantity = 1, customerEmail }: CheckoutProps) {
  const fetchClientSecret = useCallback(() => {
    return startCheckoutSession({ orderId, productId, quantity, customerEmail });
  }, [customerEmail, orderId, productId, quantity]);

  if (!stripePromise) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Stripe publishable key is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel and redeploy.
      </div>
    );
  }

  return (
    <div id="checkout" className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
