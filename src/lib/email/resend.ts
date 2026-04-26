import { Resend } from "resend";
import {
  buildDistributorOrderConfirmationTemplate,
  buildDistributorShipmentNotificationTemplate,
  buildManufacturerFulfillmentTemplate,
  buildSupportOrderCopyTemplate,
  type OrderWorkflowPayload,
  type ShipmentUpdatePayload,
} from "./templates/order-workflow";

export type DistributorOrderEmailPayload = {
  orderId?: string;
  distributorAccountName: string;
  email: string;
  customerName?: string;
  customerEmail?: string;
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
  orderNotes?: string;
  stripeSessionId?: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to send order emails.`);
  }
  return value;
}

function optionalEnv(name: string) {
  return process.env[name];
}

function parseEmailList(value: string) {
  return value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function getManufacturerEmails() {
  const emails = parseEmailList(requireEnv("MANUFACTURER_EMAILS"));
  if (emails.length === 0) {
    throw new Error("MANUFACTURER_EMAILS must include at least one email address.");
  }
  return emails;
}

function buildOrderWorkflowPayload(payload: DistributorOrderEmailPayload): OrderWorkflowPayload {
  return {
    orderId: payload.orderId,
    distributorAccountName: payload.distributorAccountName,
    distributorEmail: payload.email,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    quantity: payload.quantity,
    orderDate: new Date().toLocaleDateString("en-US"),
    shippingMethod: payload.shippingMethod,
    shipToName: payload.shipToName,
    shipToAddress: payload.shipToAddress,
    shipToAddress2: payload.shipToAddress2,
    shipToCity: payload.shipToCity,
    shipToState: payload.shipToState,
    shipToZip: payload.shipToZip,
    selectedRate: payload.selectedRate,
    bolFileName: payload.bolFileName,
    orderNotes: payload.orderNotes,
    stripeSessionId: payload.stripeSessionId,
  };
}

export async function sendDistributorOrderEmails(payload: DistributorOrderEmailPayload) {
  const resendApiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = optionalEnv("FROM_EMAIL") || "orders@cattleguardforms.com";
  const replyToEmail = optionalEnv("REPLY_TO_EMAIL") || optionalEnv("ORDERS_EMAIL") || "orders@cattleguardforms.com";
  const supportEmail = requireEnv("SUPPORT_EMAIL");
  const manufacturerEmails = getManufacturerEmails();

  const resend = new Resend(resendApiKey);
  const orderPayload = buildOrderWorkflowPayload(payload);
  const distributorTemplate = buildDistributorOrderConfirmationTemplate(orderPayload);
  const manufacturerTemplate = buildManufacturerFulfillmentTemplate(orderPayload);
  const supportTemplate = buildSupportOrderCopyTemplate(orderPayload);

  const [distributorEmail, manufacturerFulfillmentEmail, supportCopyEmail] = await Promise.all([
    resend.emails.send({
      from: fromEmail,
      to: payload.email,
      replyTo: replyToEmail,
      subject: distributorTemplate.subject,
      text: distributorTemplate.text,
    }),
    resend.emails.send({
      from: fromEmail,
      to: manufacturerEmails,
      replyTo: replyToEmail,
      subject: manufacturerTemplate.subject,
      text: manufacturerTemplate.text,
    }),
    resend.emails.send({
      from: fromEmail,
      to: supportEmail,
      replyTo: replyToEmail,
      subject: supportTemplate.subject,
      text: supportTemplate.text,
    }),
  ]);

  return {
    distributorEmail,
    manufacturerFulfillmentEmail,
    supportCopyEmail,
  };
}

export async function sendDistributorShipmentNotification(payload: ShipmentUpdatePayload) {
  const resendApiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = optionalEnv("FROM_EMAIL") || "orders@cattleguardforms.com";
  const replyToEmail = optionalEnv("REPLY_TO_EMAIL") || optionalEnv("ORDERS_EMAIL") || "orders@cattleguardforms.com";

  const resend = new Resend(resendApiKey);
  const template = buildDistributorShipmentNotificationTemplate(payload);

  return resend.emails.send({
    from: fromEmail,
    to: payload.distributorEmail,
    replyTo: replyToEmail,
    subject: template.subject,
    text: template.text,
  });
}
