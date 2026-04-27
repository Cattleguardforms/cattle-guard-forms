export const COWSTOP_PRODUCT_NAME = "CowStop Reusable Concrete Cattle Guard Form";
export const COWSTOP_UNIT_PRICE_CENTS = 149900;

export function getCowStopDiscountRate(quantity: number) {
  if (quantity === 20) return 0.25;
  if (quantity >= 5) return 0.1;
  return 0;
}

export function getCowStopCheckoutAmountCents(quantity: number) {
  const safeQuantity = Math.min(20, Math.max(1, Math.floor(quantity || 1)));
  const subtotal = safeQuantity * COWSTOP_UNIT_PRICE_CENTS;
  const discount = Math.round(subtotal * getCowStopDiscountRate(safeQuantity));
  return subtotal - discount;
}
