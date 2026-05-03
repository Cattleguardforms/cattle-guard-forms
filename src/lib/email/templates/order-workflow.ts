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
  manufacturerNotes?: string;
};

export type EmailTemplate = { subject: string; text: string };

const DEFAULT_ORDER_ID = "Pending order ID";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cattleguardforms.com";

function valueOrBlank(value?: string) { return value?.trim() || ""; }
function valueOrNotProvided(value?: string) { return value?.trim() || "Not provided"; }
function formatOrderId(orderId?: string) { return valueOrBlank(orderId) || DEFAULT_ORDER_ID; }
function url(path: string) { return `${SITE_URL.replace(/\/$/, "")}${path}`; }

function warrantyUrl(orderId: string, accessToken?: string) {
  if (orderId === DEFAULT_ORDER_ID) return url("/quote");
  const query = accessToken ? `?access=${encodeURIComponent(accessToken)}` : "";
  return url(`/customer/orders/${orderId}/warranty${query}`);
}
function installationGuideUrl() { return url("/distributor/documents/approved-packet-set"); }
function engineeringCertificateUrl() { return url("/distributor/documents/approved-packet-set"); }

function formatShippingMethodForManufacturer(payload: Pick<OrderWorkflowPayload, "shippingMethod" | "selectedRate" | "bolFileName">) {
  if (payload.shippingMethod === "own") return `Customer/distributor shipping on own account. BOL file: ${valueOrNotProvided(payload.bolFileName)}`;
  return `Cattle Guard Forms / Echo shipping. Selected rate: ${valueOrNotProvided(payload.selectedRate)}`;
}

function formatShippingMethodForCustomer(payload: Pick<OrderWorkflowPayload, "shippingMethod">) {
  if (payload.shippingMethod === "own") return "Distributor-arranged shipping";
  return "Cattle Guard Forms freight";
}

function bolTimingCopy(payload: Pick<OrderWorkflowPayload, "shippingMethod">) {
  if (payload.shippingMethod === "own") return "Your distributor will provide shipping paperwork when available.";
  return "If this order is shipping with Cattle Guard Forms freight, the BOL is normally available within 5 to 10 minutes after shipment booking. If it is not received, the distributor should contact support@cattleguardforms.com for help.";
}

function formatShipTo(payload: Pick<OrderWorkflowPayload, "shipToName" | "shipToAddress" | "shipToAddress2" | "shipToCity" | "shipToState" | "shipToZip">) {
  return [valueOrNotProvided(payload.shipToName), valueOrNotProvided(payload.shipToAddress), valueOrBlank(payload.shipToAddress2), `${valueOrBlank(payload.shipToCity)}, ${valueOrBlank(payload.shipToState)} ${valueOrBlank(payload.shipToZip)}`.trim()].filter(Boolean).join("\n");
}

export function buildManufacturerFulfillmentTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  const orderId = formatOrderId(payload.orderId);
  return {
    subject: `New CowStop Distributor Order - ${orderId}`,
    text: [
      "Hello,", "", "Please find the new CowStop distributor order below.", "",
      `Order ID: ${orderId}`,
      `Distributor: ${payload.distributorAccountName}`,
      `Distributor Email: ${payload.distributorEmail}`,
      payload.customerName ? `Customer Name: ${payload.customerName}` : null,
      payload.customerEmail ? `Customer Email: ${payload.customerEmail}` : null,
      `Order Quantity: ${payload.quantity} CowStop form(s)`,
      `Order Date: ${valueOrNotProvided(payload.orderDate)}`,
      `Shipping Method: ${formatShippingMethodForManufacturer(payload)}`,
      payload.stripeSessionId ? `Stripe Session ID: ${payload.stripeSessionId}` : null,
      "", "Ship-To Information:", formatShipTo(payload), "", "Order Notes:", valueOrNotProvided(payload.orderNotes), "",
      "Please prepare this order for fulfillment and upload or reply with the BOL when the order has shipped.", "",
      "When the order ships, please copy and paste the block below into your reply and fill in the shipping details.", "", "---", "", "SHIPPING UPDATE - COPY/PASTE BELOW", "",
      `Order ID: ${orderId}`, "Order Status: Shipped", "Ship Date:", "Carrier:", "Tracking Number / PRO Number:", "Tracking Link:", "Estimated Delivery Date:", "Number of Pallets:", "Freight Class, if available:", "BOL Number, if available:", "Manufacturer Notes:", "", "---", "", "Thank you,", "", "Cattle Guard Forms", "orders@cattleguardforms.com",
    ].filter((line): line is string => line !== null).join("\n"),
  };
}

export function buildDistributorOrderConfirmationTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  const orderId = formatOrderId(payload.orderId);
  const recipientName = payload.customerName || payload.distributorAccountName || "there";
  return {
    subject: `Your CowStop order has been placed - ${orderId}`,
    text: [
      `Hello ${recipientName},`, "",
      `Your CowStop order has been placed in care of ${payload.distributorAccountName}.`, "",
      `Order ID: ${orderId}`,
      `Quantity: ${payload.quantity} CowStop form(s)`,
      `Shipping Method: ${formatShippingMethodForCustomer(payload)}`, "",
      "Please find your customer paperwork and installation documents below:",
      `Customer Warranty Paperwork / Print Here: ${warrantyUrl(orderId, payload.stripeSessionId)}`,
      `Customer Installation Guide / Print Here: ${installationGuideUrl()}`,
      `Engineering Certificate / Print Here: ${engineeringCertificateUrl()}`, "",
      bolTimingCopy(payload), "",
      "Ship-To Information:", formatShipTo(payload), "",
      "You will receive shipment details from your distributor when the BOL or tracking information is available.", "",
      "Thank you,", "", "Cattle Guard Forms",
    ].join("\n"),
  };
}

export function buildSupportOrderCopyTemplate(payload: OrderWorkflowPayload): EmailTemplate {
  const manufacturerTemplate = buildManufacturerFulfillmentTemplate(payload);
  const customerTemplate = buildDistributorOrderConfirmationTemplate(payload);
  const orderId = formatOrderId(payload.orderId);
  return { subject: `Support Copy - CowStop Distributor Order - ${orderId}`, text: ["Support copy of CowStop order workflow emails.", "", "CUSTOMER/DISTRIBUTOR CONFIRMATION COPY", "", customerTemplate.text, "", "---", "", "MANUFACTURER FULFILLMENT COPY", "", manufacturerTemplate.text].join("\n") };
}

export function buildDistributorShipmentNotificationTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  return { subject: `Your CowStop Order Has Shipped - ${payload.orderId}`, text: [`Hello ${payload.distributorAccountName},`, "", "Your CowStop order has shipped.", "", `Order ID: ${payload.orderId}`, `Quantity: ${payload.quantity} CowStop form(s)`, `Ship Date: ${valueOrNotProvided(payload.shipDate)}`, `Carrier: ${valueOrNotProvided(payload.carrier)}`, `Tracking / PRO Number: ${valueOrNotProvided(payload.trackingNumber)}`, `Tracking Link: ${valueOrNotProvided(payload.trackingLink)}`, `Estimated Delivery: ${valueOrNotProvided(payload.estimatedDeliveryDate)}`, `Number of Pallets: ${valueOrNotProvided(payload.numberOfPallets)}`, "", "Manufacturer Notes:", valueOrNotProvided(payload.manufacturerNotes), "", "If anything looks incorrect, please reply to this email or contact orders@cattleguardforms.com.", "", "Thank you,", "", "Cattle Guard Forms"].join("\n") };
}

export function buildCustomerShipmentNotificationTemplate(payload: ShipmentUpdatePayload): EmailTemplate {
  const recipientName = payload.customerName || "there";
  return { subject: `Your CowStop Order Has Shipped - ${payload.orderId}`, text: [`Hello ${recipientName},`, "", "Your CowStop order has shipped.", "", `Order ID: ${payload.orderId}`, `Quantity: ${payload.quantity} CowStop form(s)`, `Ship Date: ${valueOrNotProvided(payload.shipDate)}`, `Carrier: ${valueOrNotProvided(payload.carrier)}`, `Tracking / PRO Number: ${valueOrNotProvided(payload.trackingNumber)}`, `Tracking Link: ${valueOrNotProvided(payload.trackingLink)}`, `Estimated Delivery: ${valueOrNotProvided(payload.estimatedDeliveryDate)}`, "", "If anything looks incorrect, please reply to this email or contact orders@cattleguardforms.com.", "", "Thank you,", "", "Cattle Guard Forms"].join("\n") };
}
