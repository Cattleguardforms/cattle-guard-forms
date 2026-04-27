export type OrderWorkflowPayload = {
  orderId?: string;
  distributorAccountName: string;
  distributorEmail: string;
  customerName?: string;
  customerEmail?: string;
  quantity: number;
  orderDate?: string;
  shippingMethod: "echo" | "own" | string;
  shipToName?: string;
  shipToAddress?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  selectedRate?: string;
  bolFileName?: string;
  orderNotes?: string;
  stripeSessionId?: string;
};

export type ShipmentUpdatePayload = {
  orderId: string;
  distributorAccountName: string;
  distributorEmail: string;
  customerName?: string;
  customerEmail?: string;
  quantity: number;
  shipDate?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
  estimatedDeliveryDate?: string;
  numberOfPallets?: string;
  freightClass?: string;
  bolNumber?: string;
  signedBolFileName?: string;
  manufacturerNotes?: string;
};

export type EmailTemplate = {
  subject: string;
  text: string;
};

const PRODUCT_NAME = "CowStop Cattle Guard Forms";
const ORDERS_EMAIL = "orders@cattleguardforms.com";
const DEFAULT_ORDER_ID = "Pending order ID";

function valueOrBlank(value?: string | number | null) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function valueOrNotProvided(value?: string | number | null) {
  return valueOrBlank(value) || "Not provided";
}

function valueOrPending(value?: string | number | null) {
  return valueOrBlank(value) || "Pending";
}

function formatOrderId(orderId?: string) {
  return valueOrBlank(orderId) || DEFAULT_ORDER_ID;
}

function orderLabel(orderId?: string) {
  return valueOrBlank(orderId) ? `Order ${orderId}` : "New order";
}

function formatShippingMethod(payload: Pick<OrderWorkflowPayload, "shippingMethod" | "selectedRate" | "bolFileName">) {
  if (payload.shippingMethod === "own") {
    return `Distributor shipping on own account. Original BOL file: ${valueOrNotProvided(payload.bolFileName)}`;
  }

  if (payload.shippingMethod === "echo") {
    return `Cattle Guard Forms / Echo shipping. Selected rate: ${valueOrNotProvided(payload.selectedRate)}`;
  }

  return `${valueOrNotProvided(payload.shippingMethod)}. Selected rate: ${valueOrNotProvided(payload.selectedRate)}`;
}

function formatShipTo(payload: Pick<OrderWorkflowPayload, "shipToName" | "shipToAddress" | "shipToAddress2" | "shipToCity" | "shipToState" | "shipToZip">) {
  return [
    valueOrNotProvided(payload.shipToName),
    valueOrNotProvided(payload.shipToAddress),
    valueOrBlank(payload.shipToAddress2),
    `${valueOrBlank(payload.shipToCity)}, ${valueOrBlank(payload.shipToState)} ${valueOrBlank(payload.shipToZip)}`.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function orderSummaryBlock(payload: OrderWorkflowPayload) {
  return [
    `Order ID: ${formatOrderId(payload.orderId)}`,
    `Order Date: ${valueOrNotProvided(payload.orderDate)}`,
    `Product: ${PRODUCT_NAME}`,
    `Quantity: ${payload.quantity} CowStop form(s)`,
    `Distributor: ${payload.distributorAccountName}`,
    `Distributor Email: ${payload.distributorEmail}`,
    payload.customerName ? `Customer Name: ${payload.customerName}` : null,
    payload.customerEmail ? `Customer Email: ${payload.customerEmail}` : null,
    payload.stripeSessionId ? `Stripe Session ID: ${payload.stripeSessionId}` : null,
    `Shipping Method: ${formatShippingMethod(payload)}`,
    `Order Notes: ${valueOrNotProvided(payload.orderNotes)}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function manufacturerReplyTemplate(orderId?: string) {
  return [
    "Please reply to this email with the shipping update below completed.",
    "",
    `Order ID: ${formatOrderId(orderId)}`,
    "Order Status:",
    "Ship Date:",
    "Carrier:",
    "Tracking Number / PRO Number:",
    "Tracking Link:",
    "Estimated Delivery Date:",
    "Number of Pallets:",
    "Freight Class:",
    "BOL Number:",
    "Signed BOL Attached: Yes / No",
    "Manufacturer Notes:",
  ].join("\n");
}

export function buildDistributorOrderConfirmationTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  const orderId = formatOrderId(payload.orderId);

  return {
    subject: `Your CowStop distributor order has been received - ${orderId}`,
    text: [
      `Hello ${payload.distributorAccountName},`,
      "",
      "Your CowStop distributor order has been received. We will send the order for fulfillment after payment and shipping details are confirmed.",
      "",
      orderSummaryBlock(payload),
      "",
      "Ship-To Information:",
      formatShipTo(payload),
      "",
      "What happens next:",
      "1. Payment and order details are verified.",
      "2. The order is prepared for manufacturer fulfillment.",
      "3. Shipping and BOL updates will be sent as they become available.",
      "",
      `Questions or changes? Reply to this email or contact ${ORDERS_EMAIL}.`,
      "",
      "Cattle Guard Forms Orders Team",
    ].join("\n"),
  };
}

export function buildCustomerOrderConfirmationTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  const recipientName = payload.customerName || "there";

  return {
    subject: `Your CowStop order has been received - ${formatOrderId(payload.orderId)}`,
    text: [
      `Hello ${recipientName},`,
      "",
      "Your CowStop order has been received through your distributor. We will share shipping updates as they become available.",
      "",
      orderSummaryBlock(payload),
      "",
      "Ship-To Information:",
      formatShipTo(payload),
      "",
      `Questions? Reply to this email or contact ${ORDERS_EMAIL}.`,
      "",
      "Cattle Guard Forms Orders Team",
    ].join("\n"),
  };
}

export function buildPaymentReceivedTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Payment received - ${orderLabel(payload.orderId)}`,
    text: [
      `Hello ${payload.distributorAccountName},`,
      "",
      `Payment has been received for ${orderLabel(payload.orderId)}.`,
      "",
      orderSummaryBlock(payload),
      "",
      "The order can now move into manufacturer fulfillment after final order review.",
      "",
      `For questions, reply here or contact ${ORDERS_EMAIL}.`,
    ].join("\n"),
  };
}

export function buildManufacturerFulfillmentTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  const orderId = formatOrderId(payload.orderId);

  return {
    subject: `New CowStop fulfillment request - ${orderId} - ${payload.quantity} form(s)`,
    text: [
      "Hello,",
      "",
      "Please find the new CowStop distributor order below.",
      "",
      orderSummaryBlock(payload),
      "",
      "Ship-To Information:",
      formatShipTo(payload),
      "",
      "Required manufacturer action:",
      "1. Review the order and shipping/BOL details.",
      "2. Confirm ship date, carrier, tracking/PRO, pallet count, freight class, and BOL number.",
      "3. Attach the signed BOL when available.",
      "",
      manufacturerReplyTemplate(payload.orderId),
      "",
      `Send all replies and attachments to ${ORDERS_EMAIL}.`,
      "",
      "Thank you,",
      "Cattle Guard Forms Orders Team",
    ].join("\n"),
  };
}

export function buildManufacturerOriginalBolAttachedTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Original BOL available - ${orderLabel(payload.orderId)}`,
    text: [
      "The distributor-provided original BOL is available for this order.",
      "",
      orderSummaryBlock(payload),
      "",
      "Ship-To Information:",
      formatShipTo(payload),
      "",
      `Original BOL file: ${valueOrNotProvided(payload.bolFileName)}`,
      "",
      manufacturerReplyTemplate(payload.orderId),
    ].join("\n"),
  };
}

export function buildManufacturerMissingShipDateReminderTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Ship date needed - ${orderLabel(payload.orderId)}`,
    text: [
      "Please provide the ship date and carrier details for this order.",
      "",
      orderSummaryBlock(payload),
      "",
      manufacturerReplyTemplate(payload.orderId),
    ].join("\n"),
  };
}

export function buildManufacturerMissingSignedBolReminderTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Signed BOL needed - ${orderLabel(payload.orderId)}`,
    text: [
      "Please provide the signed BOL for this order when available.",
      "",
      orderSummaryBlock(payload),
      "",
      manufacturerReplyTemplate(payload.orderId),
    ].join("\n"),
  };
}

export function buildDistributorShipmentNotificationTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  return {
    subject: `Your CowStop order has shipped - ${payload.orderId}`,
    text: [
      `Hello ${payload.distributorAccountName},`,
      "",
      "Your CowStop order has shipped.",
      "",
      `Order ID: ${payload.orderId}`,
      `Customer: ${valueOrNotProvided(payload.customerName)}`,
      `Quantity: ${payload.quantity} CowStop form(s)`,
      `Ship Date: ${valueOrNotProvided(payload.shipDate)}`,
      `Carrier: ${valueOrNotProvided(payload.carrier)}`,
      `Tracking / PRO Number: ${valueOrNotProvided(payload.trackingNumber)}`,
      `Tracking Link: ${valueOrNotProvided(payload.trackingLink)}`,
      `Estimated Delivery: ${valueOrNotProvided(payload.estimatedDeliveryDate)}`,
      `Number of Pallets: ${valueOrNotProvided(payload.numberOfPallets)}`,
      `Freight Class: ${valueOrNotProvided(payload.freightClass)}`,
      `BOL Number: ${valueOrNotProvided(payload.bolNumber)}`,
      `Signed BOL: ${valueOrNotProvided(payload.signedBolFileName)}`,
      "",
      "Manufacturer Notes:",
      valueOrNotProvided(payload.manufacturerNotes),
      "",
      `If anything looks incorrect, please reply to this email or contact ${ORDERS_EMAIL}.`,
      "",
      "Cattle Guard Forms Orders Team",
    ].join("\n"),
  };
}

export function buildCustomerShipmentNotificationTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  const recipientName = payload.customerName || "there";

  return {
    subject: `Your CowStop order has shipped - ${payload.orderId}`,
    text: [
      `Hello ${recipientName},`,
      "",
      "Your CowStop order has shipped.",
      "",
      `Order ID: ${payload.orderId}`,
      `Quantity: ${payload.quantity} CowStop form(s)`,
      `Ship Date: ${valueOrNotProvided(payload.shipDate)}`,
      `Carrier: ${valueOrNotProvided(payload.carrier)}`,
      `Tracking / PRO Number: ${valueOrNotProvided(payload.trackingNumber)}`,
      `Tracking Link: ${valueOrNotProvided(payload.trackingLink)}`,
      `Estimated Delivery: ${valueOrNotProvided(payload.estimatedDeliveryDate)}`,
      "",
      `If anything looks incorrect, please reply to this email or contact ${ORDERS_EMAIL}.`,
      "",
      "Cattle Guard Forms Orders Team",
    ].join("\n"),
  };
}

export function buildSignedBolAvailableTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  return {
    subject: `Signed BOL available - ${payload.orderId}`,
    text: [
      `Hello ${payload.distributorAccountName},`,
      "",
      "The signed BOL is now available for your order.",
      "",
      `Order ID: ${payload.orderId}`,
      `Signed BOL file: ${valueOrNotProvided(payload.signedBolFileName)}`,
      `Carrier: ${valueOrNotProvided(payload.carrier)}`,
      `Tracking / PRO: ${valueOrNotProvided(payload.trackingNumber)}`,
      "",
      `Questions? Reply to this email or contact ${ORDERS_EMAIL}.`,
    ].join("\n"),
  };
}

export function buildSupportOrderCopyTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Admin copy - ${orderLabel(payload.orderId)} - ${payload.distributorAccountName}`,
    text: [
      "Admin order copy.",
      "",
      orderSummaryBlock(payload),
      "",
      "Ship-To Information:",
      formatShipTo(payload),
      "",
      "Admin checklist:",
      "- Confirm payment status.",
      "- Confirm distributor pricing and quantity.",
      "- Confirm BOL path if distributor uses own shipper.",
      "- Confirm manufacturer order email was sent.",
      "- Watch for manufacturer ship-date and signed-BOL response.",
    ].join("\n"),
  };
}

export function buildAdminMissingBolAlertTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Missing BOL alert - ${orderLabel(payload.orderId)}`,
    text: [
      "Admin alert: original BOL is missing or not yet linked to the order.",
      "",
      orderSummaryBlock(payload),
      "",
      "Recommended action: contact the distributor or upload the BOL manually from Admin Portal once storage is wired.",
    ].join("\n"),
  };
}

export function buildAdminManufacturerResponseReceivedTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  return {
    subject: `Manufacturer response received - ${payload.orderId}`,
    text: [
      "Admin alert: manufacturer response received.",
      "",
      `Order ID: ${payload.orderId}`,
      `Distributor: ${payload.distributorAccountName}`,
      `Distributor Email: ${payload.distributorEmail}`,
      `Ship Date: ${valueOrNotProvided(payload.shipDate)}`,
      `Carrier: ${valueOrNotProvided(payload.carrier)}`,
      `Tracking / PRO: ${valueOrNotProvided(payload.trackingNumber)}`,
      `Signed BOL: ${valueOrNotProvided(payload.signedBolFileName)}`,
      `Notes: ${valueOrNotProvided(payload.manufacturerNotes)}`,
    ].join("\n"),
  };
}

export function buildAdminManufacturerFailedToRespondReminderTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  return {
    subject: `Manufacturer follow-up needed - ${orderLabel(payload.orderId)}`,
    text: [
      "Admin reminder: manufacturer response has not been received for this order.",
      "",
      orderSummaryBlock(payload),
      "",
      "Recommended action: resend the manufacturer fulfillment request or contact the manufacturer directly.",
    ].join("\n"),
  };
}

export function buildAdminShipmentCompleteTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  return {
    subject: `Shipment complete/update received - ${payload.orderId}`,
    text: [
      "Admin shipment update received.",
      "",
      `Order ID: ${payload.orderId}`,
      `Distributor: ${payload.distributorAccountName}`,
      `Distributor Email: ${payload.distributorEmail}`,
      `Ship Date: ${valueOrNotProvided(payload.shipDate)}`,
      `Carrier: ${valueOrNotProvided(payload.carrier)}`,
      `Tracking / PRO: ${valueOrNotProvided(payload.trackingNumber)}`,
      `Signed BOL: ${valueOrNotProvided(payload.signedBolFileName)}`,
      `Notes: ${valueOrNotProvided(payload.manufacturerNotes)}`,
    ].join("\n"),
  };
}
