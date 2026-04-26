import { Resend } from "resend";

export type DistributorOrderEmailPayload = {
  distributorAccountName: string;
  email: string;
  quantity: number;
  shippingMethod: "echo" | "own" | string;
  shipToName?: string;
  shipToAddress?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  selectedRate?: string;
  bolFileName?: string;
  stripeSessionId?: string;
};

const UNIT_PRICE = 750;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to send distributor order emails.`);
  }
  return value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatShippingDetails(payload: DistributorOrderEmailPayload) {
  if (payload.shippingMethod === "own") {
    return `Shipping Method: Ship on My Own\nBOL File: ${payload.bolFileName || "Not provided"}`;
  }

  return [
    "Shipping Method: Use Cattle Guard Forms / Echo shipping",
    `Selected Rate: ${payload.selectedRate || "Pending live Echo rate"}`,
    `Ship To: ${payload.shipToName || ""}`,
    `Address 1: ${payload.shipToAddress || ""}`,
    `Address 2: ${payload.shipToAddress2 || ""}`,
    `City: ${payload.shipToCity || ""}`,
    `State: ${payload.shipToState || ""}`,
    `ZIP: ${payload.shipToZip || ""}`,
  ].join("\n");
}

function buildOrderText(payload: DistributorOrderEmailPayload) {
  const quantity = Number(payload.quantity) || 0;
  const total = quantity * UNIT_PRICE;

  return [
    `Distributor: ${payload.distributorAccountName}`,
    `Distributor Email: ${payload.email}`,
    `Quantity: ${quantity}`,
    `Unit Price: ${formatCurrency(UNIT_PRICE)}`,
    `Product Total: ${formatCurrency(total)}`,
    payload.stripeSessionId ? `Stripe Session ID: ${payload.stripeSessionId}` : "Stripe Session ID: Pending/not provided",
    "",
    formatShippingDetails(payload),
    "",
    "Manufacturer: please reply with the expected ship date for this order.",
  ].join("\n");
}

export async function sendDistributorOrderEmails(payload: DistributorOrderEmailPayload) {
  const resendApiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = requireEnv("FROM_EMAIL");
  const supportEmail = requireEnv("SUPPORT_EMAIL");
  const manufacturerEmail = requireEnv("MANUFACTURER_EMAIL");

  const resend = new Resend(resendApiKey);
  const orderText = buildOrderText(payload);
  const subject = `CowStop Distributor Order - ${payload.distributorAccountName}`;

  const [distributorEmail, manufacturerFulfillmentEmail, supportCopyEmail] = await Promise.all([
    resend.emails.send({
      from: fromEmail,
      to: payload.email,
      subject: "Your CowStop distributor order has been received",
      text: [
        `Hello ${payload.distributorAccountName},`,
        "",
        "Your CowStop distributor order has been received. Once payment and shipping/BOL details are confirmed, the order will be sent for fulfillment.",
        "",
        orderText,
      ].join("\n"),
    }),
    resend.emails.send({
      from: fromEmail,
      to: manufacturerEmail,
      subject,
      text: [
        "A new CowStop distributor order is ready for manufacturer review.",
        "",
        orderText,
      ].join("\n"),
    }),
    resend.emails.send({
      from: fromEmail,
      to: supportEmail,
      subject: `Support Copy - ${subject}`,
      text: [
        "Support copy of CowStop distributor order email.",
        "",
        orderText,
      ].join("\n"),
    }),
  ]);

  return {
    distributorEmail,
    manufacturerFulfillmentEmail,
    supportCopyEmail,
  };
}
