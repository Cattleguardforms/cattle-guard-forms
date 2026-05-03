import { Resend } from "resend";
import {
  buildSupportRequestReceivedTemplate,
  buildSupportRequestTeamNotificationTemplate,
  type SupportRequestPayload,
} from "./templates/confirmation-workflow";
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
  bolAttachment?: { filename: string; content: Buffer; contentType?: string };
  orderNotes?: string;
  stripeSessionId?: string;
};

const TRANSACTIONAL_FROM_EMAIL = "orders@cattleguardforms.com";
const TRANSACTIONAL_REPLY_TO_EMAIL = "support@cattleguardforms.com";
const TRANSACTIONAL_SUPPORT_EMAIL = "support@cattleguardforms.com";

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function requireEnv(name: string) { const value = clean(process.env[name]); if (!value) throw new Error(`${name} is required to send order emails.`); return value; }
function parseEmailList(value: string) { return value.split(",").map((email) => email.trim()).filter(isValidEmail); }
function uniqueEmails(values: Array<string | undefined>) { return values.map((value) => clean(value).toLowerCase()).filter(isValidEmail).filter((value, index, list) => list.indexOf(value) === index); }
function getManufacturerEmails() { const emails = parseEmailList(requireEnv("MANUFACTURER_EMAILS")); if (emails.length === 0) throw new Error("MANUFACTURER_EMAILS must include at least one valid email address."); return emails; }
function getEmailSettings() { return { resendApiKey: requireEnv("RESEND_API_KEY"), fromEmail: TRANSACTIONAL_FROM_EMAIL, replyToEmail: TRANSACTIONAL_REPLY_TO_EMAIL, supportEmail: TRANSACTIONAL_SUPPORT_EMAIL }; }

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

function buildAttachments(payload: DistributorOrderEmailPayload) {
  if (!payload.bolAttachment) return undefined;
  return [{ filename: payload.bolAttachment.filename, content: payload.bolAttachment.content, contentType: payload.bolAttachment.contentType }];
}

export async function sendDistributorOrderEmails(payload: DistributorOrderEmailPayload) {
  const { resendApiKey, fromEmail, replyToEmail, supportEmail } = getEmailSettings();
  const manufacturerEmails = getManufacturerEmails();
  const resend = new Resend(resendApiKey);
  const orderPayload = buildOrderWorkflowPayload(payload);
  const distributorTemplate = buildDistributorOrderConfirmationTemplate(orderPayload);
  const manufacturerTemplate = buildManufacturerFulfillmentTemplate(orderPayload);
  const supportTemplate = buildSupportOrderCopyTemplate(orderPayload);
  const attachments = buildAttachments(payload);
  const confirmationRecipients = uniqueEmails([payload.email, payload.customerEmail]);

  const [confirmationEmail, manufacturerFulfillmentEmail, supportCopyEmail] = await Promise.all([
    resend.emails.send({
      from: fromEmail,
      to: confirmationRecipients,
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
      attachments,
    }),
    resend.emails.send({
      from: fromEmail,
      to: supportEmail,
      replyTo: replyToEmail,
      subject: supportTemplate.subject,
      text: supportTemplate.text,
      attachments,
    }),
  ]);

  return { distributorEmail: confirmationEmail, customerEmail: confirmationEmail, manufacturerFulfillmentEmail, supportCopyEmail };
}

export async function sendDistributorShipmentNotification(payload: ShipmentUpdatePayload) {
  const { resendApiKey, fromEmail, replyToEmail } = getEmailSettings();
  const resend = new Resend(resendApiKey);
  const template = buildDistributorShipmentNotificationTemplate(payload);
  return resend.emails.send({ from: fromEmail, to: payload.distributorEmail, replyTo: replyToEmail, subject: template.subject, text: template.text });
}

export async function sendSupportRequestEmails(payload: SupportRequestPayload) {
  const { resendApiKey, fromEmail, replyToEmail, supportEmail } = getEmailSettings();
  const resend = new Resend(resendApiKey);
  const customerTemplate = buildSupportRequestReceivedTemplate(payload);
  const teamTemplate = buildSupportRequestTeamNotificationTemplate(payload);
  const [customerEmail, supportCopyEmail] = await Promise.all([
    resend.emails.send({ from: fromEmail, to: payload.email, replyTo: replyToEmail, subject: customerTemplate.subject, text: customerTemplate.text }),
    resend.emails.send({ from: fromEmail, to: supportEmail, replyTo: replyToEmail, subject: teamTemplate.subject, text: teamTemplate.text }),
  ]);
  return { customerEmail, supportCopyEmail };
}
