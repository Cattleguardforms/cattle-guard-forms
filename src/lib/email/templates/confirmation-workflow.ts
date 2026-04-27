// Email confirmation and support workflow templates.
export type EmailTemplate = {
  subject: string;
  text: string;
};

export type QuoteConfirmationPayload = {
  leadId?: string;
  orderId?: string;
  customerName?: string;
  customerEmail: string;
  company?: string;
  phone?: string;
  productName?: string;
  quantity?: number | string;
  projectLocation?: string;
  installationNeeded?: boolean | null;
  deliveryNeeded?: boolean | null;
  notes?: string;
};

export type InternalLeadNotificationPayload = QuoteConfirmationPayload & {
  source?: string;
};

export type PaymentReceivedPayload = {
  orderId: string;
  recipientName?: string;
  recipientEmail: string;
  productName?: string;
  quantity?: number | string;
  amount?: string;
  paymentDate?: string;
  nextStep?: string;
};

export type AbandonedCheckoutPayload = {
  recipientName?: string;
  recipientEmail: string;
  productName?: string;
  quantity?: number | string;
  checkoutLink?: string;
  supportEmail?: string;
};

export type SupportRequestPayload = {
  supportId?: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  topic?: string;
  orderId?: string;
  message?: string;
  source?: string;
};

export type AdminTestEmailPayload = {
  recipientEmail: string;
  sentAt?: string;
  environment?: string;
};

function valueOrBlank(value?: string | number | null) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function valueOrNotProvided(value?: string | number | null) {
  return valueOrBlank(value) || "Not provided";
}

function yesNo(value?: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not provided";
}

function customerGreeting(name?: string) {
  const cleanName = valueOrBlank(name);
  return cleanName ? `Hello ${cleanName},` : "Hello,";
}

function formatProduct(payload: Pick<QuoteConfirmationPayload, "productName" | "quantity">) {
  return [
    `Product: ${valueOrNotProvided(payload.productName || "CowStop Reusable Concrete Cattle Guard Forms")}`,
    `Quantity: ${valueOrNotProvided(payload.quantity)}`,
  ].join("\n");
}

export function buildCustomerQuoteConfirmationTemplate(payload: QuoteConfirmationPayload): EmailTemplate {
  const orderId = valueOrBlank(payload.orderId || payload.leadId);

  return {
    subject: orderId
      ? `We received your Cattle Guard Forms request - ${orderId}`
      : "We received your Cattle Guard Forms request",
    text: [
      customerGreeting(payload.customerName),
      "",
      "Thank you for contacting Cattle Guard Forms. We received your request and our team will review the details before following up with pricing, availability, shipping, and next steps.",
      "",
      orderId ? `Reference ID: ${orderId}` : null,
      formatProduct(payload),
      `Company: ${valueOrNotProvided(payload.company)}`,
      `Phone: ${valueOrNotProvided(payload.phone)}`,
      `Project Location: ${valueOrNotProvided(payload.projectLocation)}`,
      `Installation Needed: ${yesNo(payload.installationNeeded)}`,
      `Delivery Needed: ${yesNo(payload.deliveryNeeded)}`,
      "",
      "Notes Received:",
      valueOrNotProvided(payload.notes),
      "",
      "What happens next:",
      "1. We review the request details.",
      "2. We confirm quantity, shipping or pickup details, and any project constraints.",
      "3. We reply with the next step for quote, order, or distributor support.",
      "",
      "If anything above is incorrect, reply to this email with the correction.",
      "",
      "Thank you,",
      "Cattle Guard Forms",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
}

export function buildInternalLeadNotificationTemplate(payload: InternalLeadNotificationPayload): EmailTemplate {
  const orderId = valueOrBlank(payload.orderId || payload.leadId) || "Pending";

  return {
    subject: `New Cattle Guard Forms Lead / Quote Request - ${orderId}`,
    text: [
      "New website lead or quote request received.",
      "",
      `Reference ID: ${orderId}`,
      `Source: ${valueOrNotProvided(payload.source || "Website quote intake")}`,
      `Customer: ${valueOrNotProvided(payload.customerName)}`,
      `Email: ${payload.customerEmail}`,
      `Phone: ${valueOrNotProvided(payload.phone)}`,
      `Company: ${valueOrNotProvided(payload.company)}`,
      "",
      formatProduct(payload),
      `Project Location: ${valueOrNotProvided(payload.projectLocation)}`,
      `Installation Needed: ${yesNo(payload.installationNeeded)}`,
      `Delivery Needed: ${yesNo(payload.deliveryNeeded)}`,
      "",
      "Customer Notes:",
      valueOrNotProvided(payload.notes),
      "",
      "Recommended action:",
      "- Review the CRM/order record.",
      "- Confirm quantity and shipping details.",
      "- Reply to the customer with quote/order next steps.",
    ].join("\n"),
  };
}

export function buildPaymentReceivedTemplate(payload: PaymentReceivedPayload): EmailTemplate {
  return {
    subject: `Payment received for your CowStop order - ${payload.orderId}`,
    text: [
      customerGreeting(payload.recipientName),
      "",
      "We received payment for your CowStop order. Your order will now move into confirmation and fulfillment review.",
      "",
      `Order ID: ${payload.orderId}`,
      `Product: ${valueOrNotProvided(payload.productName || "CowStop Reusable Concrete Cattle Guard Forms")}`,
      `Quantity: ${valueOrNotProvided(payload.quantity)}`,
      `Amount: ${valueOrNotProvided(payload.amount)}`,
      `Payment Date: ${valueOrNotProvided(payload.paymentDate || new Date().toLocaleDateString("en-US"))}`,
      "",
      "Next Step:",
      valueOrNotProvided(payload.nextStep || "We will confirm fulfillment and shipping details. You will receive another update when shipment information is available."),
      "",
      "Thank you,",
      "Cattle Guard Forms",
    ].join("\n"),
  };
}

export function buildAbandonedCheckoutRecoveryTemplate(payload: AbandonedCheckoutPayload): EmailTemplate {
  return {
    subject: "Need help finishing your CowStop order?",
    text: [
      customerGreeting(payload.recipientName),
      "",
      "It looks like you started a CowStop order but did not finish checkout. If you still need reusable concrete cattle guard forms, we can help confirm quantity, shipping, and next steps.",
      "",
      `Product: ${valueOrNotProvided(payload.productName || "CowStop Reusable Concrete Cattle Guard Forms")}`,
      `Quantity: ${valueOrNotProvided(payload.quantity)}`,
      payload.checkoutLink ? `Resume Checkout: ${payload.checkoutLink}` : null,
      "",
      "If you have questions before ordering, reply to this email and we can help.",
      "",
      "Thank you,",
      "Cattle Guard Forms",
      valueOrBlank(payload.supportEmail),
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
}

export function buildSupportRequestReceivedTemplate(payload: SupportRequestPayload): EmailTemplate {
  const reference = valueOrBlank(payload.supportId || payload.orderId);

  return {
    subject: reference ? `We received your support request - ${reference}` : "We received your support request",
    text: [
      customerGreeting(payload.name),
      "",
      "Thank you for contacting Cattle Guard Forms support. We received your message and will review it as soon as possible.",
      "",
      reference ? `Reference ID: ${reference}` : null,
      `Topic: ${valueOrNotProvided(payload.topic)}`,
      `Order ID: ${valueOrNotProvided(payload.orderId)}`,
      "",
      "Message Received:",
      valueOrNotProvided(payload.message),
      "",
      "If this is related to an active order, please reply with any BOL, tracking, quantity, shipping address, or order details that will help us route it correctly.",
      "",
      "Thank you,",
      "Cattle Guard Forms Support",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
}

export function buildSupportRequestTeamNotificationTemplate(payload: SupportRequestPayload): EmailTemplate {
  const reference = valueOrBlank(payload.supportId || payload.orderId) || "Pending";

  return {
    subject: `Support Request Received - ${reference}`,
    text: [
      "New support request received.",
      "",
      `Reference ID: ${reference}`,
      `Source: ${valueOrNotProvided(payload.source || "Website support/contact form")}`,
      `Name: ${valueOrNotProvided(payload.name)}`,
      `Email: ${payload.email}`,
      `Phone: ${valueOrNotProvided(payload.phone)}`,
      `Company: ${valueOrNotProvided(payload.company)}`,
      `Topic: ${valueOrNotProvided(payload.topic)}`,
      `Order ID: ${valueOrNotProvided(payload.orderId)}`,
      "",
      "Message:",
      valueOrNotProvided(payload.message),
      "",
      "Routing notes:",
      "- If this references an order ID, attach this support request to the order record.",
      "- If the customer includes BOL or tracking information, route it to the matching order/shipping workflow.",
      "- If no order ID is included, search by email/company in CRM before replying.",
    ].join("\n"),
  };
}

export function buildAdminTestEmailTemplate(payload: AdminTestEmailPayload): EmailTemplate {
  return {
    subject: "Cattle Guard Forms email test",
    text: [
      "Cattle Guard Forms email configuration test.",
      "",
      `Recipient: ${payload.recipientEmail}`,
      `Sent At: ${payload.sentAt || new Date().toISOString()}`,
      `Environment: ${payload.environment || process.env.NODE_ENV || "unknown"}`,
      "",
      "If you received this message, Resend and the current email environment variables are working.",
    ].join("\n"),
  };
}
