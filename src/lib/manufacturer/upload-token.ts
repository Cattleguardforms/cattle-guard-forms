import crypto from "crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.CGF_UPLOAD_TOKEN_SECRET || process.env.CRON_SECRET || process.env.STRIPE_WEBHOOK_SECRET || process.env.RESEND_API_KEY || "";
  if (!value) throw new Error("CGF_UPLOAD_TOKEN_SECRET, CRON_SECRET, STRIPE_WEBHOOK_SECRET, or RESEND_API_KEY is required for manufacturer upload links.");
  return value;
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createManufacturerUploadToken(orderId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = base64url(JSON.stringify({ orderId, purpose: "manufacturer_bol_upload", exp }));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyManufacturerUploadToken(token: string, orderId: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) throw new Error("Invalid upload token.");
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid upload token signature.");

  let decoded: { orderId?: string; purpose?: string; exp?: number } = {};
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid upload token payload.");
  }

  if (decoded.purpose !== "manufacturer_bol_upload") throw new Error("Invalid upload token purpose.");
  if (decoded.orderId !== orderId) throw new Error("Upload token does not match this order.");
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) throw new Error("This upload link has expired.");
  return true;
}

export function buildManufacturerUploadUrl(orderId: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://cattleguardforms.com").replace(/\/$/, "");
  const token = createManufacturerUploadToken(orderId);
  return `${siteUrl}/manufacturer/upload-bol?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
}
