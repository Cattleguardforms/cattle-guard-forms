import { NextRequest, NextResponse } from "next/server";
import { callEcho, readEchoBody } from "@/lib/echo/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORIGIN = {
  locationName: "Meese",
  addressLine1: "1745 Cragmont St",
  city: "Madison",
  stateProvince: "IN",
  postalCode: "47250",
  countryCode: "US",
  contactName: "Shipping Department",
  contactPhone: "8008294535",
  locationType: "BUSINESS",
};

const FREIGHT_CLASS = "150";
const APPROVED_ADMIN_EMAILS = new Set(["orders@cattleguardforms.com", "support@cattleguardforms.com"]);
const STATE_CODES: Record<string, string> = { FLORIDA: "FL" };

type BookingBody = {
  orderId?: string;
  dryRun?: boolean;
  quantity?: number;
  carrierScac?: string;
  carrierName?: string;
  bolNumber?: string;
  poNumber?: string;
  pickupDate?: string;
  deliveryDate?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryType?: string;
  liftgateRequired?: string;
  specialInstructions?: string;
};

type DbRecord = Record<string, unknown>;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function phone(value: unknown) {
  return clean(value).replace(/[^0-9]/g, "");
}

function normalizeState(value: string) {
  const upper = clean(value).toUpperCase();
  if (upper.length === 2) return upper;
  return STATE_CODES[upper] ?? upper;
}

function normalizeAddress(value: string) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function requireAdmin(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) throw new Error("Missing admin session token.");
  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid admin session.");
  const email = userData.user.email.toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();
  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  const hasAdminProfile = Boolean(profile && profile.role === "admin" && profile.status === "active");
  if (!hasAdminProfile && !APPROVED_ADMIN_EMAILS.has(email)) throw new Error("Admin role is required.");
  return supabase;
}

function addBusinessDays(startDate: Date, days: number) {
  const date = new Date(startDate);
  while (days > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) days -= 1;
  }
  return date;
}

function echoDate(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function palletPlan(quantity: number) {
  return { palletCount: Math.ceil(quantity / 6), totalWeight: Math.max(105, quantity * 85 + 20) };
}

function val(bodyValue: unknown, order: DbRecord | null, keys: string[], fallback = "") {
  const direct = clean(bodyValue);
  if (direct) return direct;
  for (const key of keys) {
    const fromOrder = clean(order?.[key]);
    if (fromOrder) return fromOrder;
  }
  return fallback;
}

function customerVal(bodyValue: unknown, customer: DbRecord | null, keys: string[], fallback = "") {
  const direct = clean(bodyValue);
  if (direct) return direct;
  for (const key of keys) {
    const fromCustomer = clean(customer?.[key]);
    if (fromCustomer) return fromCustomer;
  }
  return fallback;
}

function makeBol(orderId: string) {
  const prefix = clean(orderId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "TEST";
  return `CGF${prefix}${Date.now().toString().slice(-8)}`.slice(0, 40);
}

function locationType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("residential") || normalized.includes("farm") || normalized.includes("home")) return "RESIDENTIAL";
  if (normalized.includes("construction") || normalized.includes("job")) return "CONSTRUCTIONSITE";
  return "BUSINESS";
}

function accessorials(destinationType: string, liftgate: string) {
  const items: string[] = [];
  if (liftgate.toLowerCase() === "yes") items.push("LIFTGATEREQUIRED");
  return items;
}

function extractLoadId(echoResponse: unknown): string {
  if (!echoResponse || typeof echoResponse !== "object") return "";
  const record = echoResponse as Record<string, unknown>;
  for (const key of ["ShipmentId", "ShipmentID", "EchoLoadId", "EchoLoadID", "LoadId", "LoadID", "Id", "id"]) {
    const candidate = record[key];
    if (typeof candidate === "number") return String(candidate);
    const text = clean(candidate);
    if (text) return text;
  }
  for (const value of Object.values(record)) {
    const nested = extractLoadId(value);
    if (nested) return nested;
  }
  return "";
}

async function getOrderAndCustomer(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string) {
  if (!orderId) return { order: null, customer: null };
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!order) throw new Error("Order not found.");
  const customerId = clean((order as DbRecord).customer_id);
  if (!customerId) return { order: order as DbRecord, customer: null };
  const { data: customer, error: customerError } = await supabase.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (customerError) throw new Error(`Customer lookup failed: ${customerError.message}`);
  return { order: order as DbRecord, customer: (customer ?? null) as DbRecord | null };
}

function buildRequest(body: BookingBody, order: DbRecord | null, customer: DbRecord | null) {
  const quantity = Number(body.quantity ?? order?.cowstop_quantity ?? order?.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new Error("Quantity must be between 1 and 50.");
  const plan = palletPlan(quantity);
  const orderId = clean(body.orderId || order?.id);
  const bolNumber = clean(body.bolNumber) || makeBol(orderId);
  const deliveryType = val(body.deliveryType, order, ["delivery_type"], "residential");
  const liftgateRequired = val(body.liftgateRequired, order, ["liftgate_required"], "yes");
  const destType = locationType(deliveryType);
  const shipToName = customerVal(body.shipToName, customer, ["company", "first_name"], val(undefined, order, ["raw_vendor_name", "normalized_vendor_name"], "Customer"));
  const shipToAddress = val(body.shipToAddress, order, ["project_address_line1", "ship_to_address"]);
  const rawShipToAddress2 = val(body.shipToAddress2, order, ["project_address_line2", "ship_to_address_2"]);
  const shipToAddress2 = normalizeAddress(rawShipToAddress2) === normalizeAddress(shipToAddress) ? "" : rawShipToAddress2;
  const shipToCity = val(body.shipToCity, order, ["project_city", "ship_to_city"]);
  const shipToState = normalizeState(val(body.shipToState, order, ["project_state", "ship_to_state"]));
  const shipToZip = val(body.shipToZip, order, ["project_postal_code", "ship_to_zip"]);
  const contactName = clean(body.contactName) || shipToName;
  const contactEmail = customerVal(body.contactEmail, customer, ["email"], clean(order?.order_contact_email));
  const contactPhone = phone(body.contactPhone) || phone(customer?.phone) || phone(order?.contact_phone);
  if ([shipToName, shipToAddress, shipToCity, shipToState, shipToZip, contactPhone].some((x) => !clean(x))) {
    throw new Error("Ship-to name, address, city, state, ZIP, and contact phone are required before booking Echo LTL shipment.");
  }
  if (shipToState.length !== 2) throw new Error("Ship-to state must be a valid 2-letter state code before booking Echo LTL shipment.");
  const selectedRate = clean(order?.selected_rate);
  const carrierName = clean(body.carrierName) || clean(order?.carrier) || selectedRate.split("|")[0]?.trim();
  const pickupDate = clean(body.pickupDate) || echoDate(addBusinessDays(new Date(), 3));
  const deliveryDate = clean(body.deliveryDate) || echoDate(addBusinessDays(new Date(), 8));
  const specialInstructions = (clean(body.specialInstructions) || `Cattle Guard Forms order ${orderId || bolNumber}`).slice(0, 140);

  const shipmentRequest = {
    BolNumber: bolNumber,
    PoNumber: clean(body.poNumber) || orderId.slice(0, 40),
    UnitOfWeight: "LB",
    PickUpDate: pickupDate,
    DeliveryDate: deliveryDate,
    PalletQuantity: plan.palletCount,
    CarrierSCAC: clean(body.carrierScac) || undefined,
    CarrierName: carrierName || undefined,
    SpecialInstructions: specialInstructions,
    Stops: [
      {
        StopNumber: 1,
        StopType: "Pickup",
        LocationType: ORIGIN.locationType,
        LocationName: ORIGIN.locationName,
        AddressLine1: ORIGIN.addressLine1,
        City: ORIGIN.city,
        StateProvince: ORIGIN.stateProvince,
        PostalCode: ORIGIN.postalCode,
        CountryCode: ORIGIN.countryCode,
        ContactName: ORIGIN.contactName,
        ContactPhone: ORIGIN.contactPhone,
        Accessorials: [],
      },
      {
        StopNumber: 2,
        StopType: "Delivery",
        LocationType: destType,
        LocationName: shipToName.slice(0, 60),
        AddressLine1: shipToAddress,
        AddressLine2: shipToAddress2 || undefined,
        City: shipToCity,
        StateProvince: shipToState,
        PostalCode: shipToZip,
        CountryCode: "US",
        ContactName: contactName,
        ContactPhone: contactPhone,
        ContactEmail: contactEmail || undefined,
        Accessorials: accessorials(destType, liftgateRequired),
      },
    ],
    Items: [
      {
        Description: "CowStop reusable concrete cattle guard forms",
        NmfcClass: FREIGHT_CLASS,
        FreightClass: FREIGHT_CLASS,
        Weight: plan.totalWeight,
        Quantity: plan.palletCount,
        PackageType: "PALLETS",
        PackageQuantity: plan.palletCount,
        HandlingUnitType: "PALLETS",
        HandlingUnitQuantity: plan.palletCount,
        HazardousMaterial: false,
      },
    ],
    References: [{ Type: "Order", Value: orderId || bolNumber }],
  };

  return { shipmentRequest, meta: { orderId, bolNumber, pickupDate, deliveryDate, carrierName, palletPlan: plan } };
}

async function markBooked(supabase: ReturnType<typeof createSupabaseAdminClient>, orderId: string, bolNumber: string, carrierName: string, echoLoadId: string) {
  if (!orderId) return;
  const now = new Date().toISOString();
  const manufacturerNotes = [`Echo shipment booked at ${now}`, echoLoadId ? `Echo Load ID: ${echoLoadId}` : "Echo Load ID was not parsed from response", `BOL Number: ${bolNumber}`].join("\n");
  const { error } = await supabase
    .from("orders")
    .update({ bol_number: bolNumber, carrier: carrierName || null, shipment_status: "echo_booked", manufacturer_notes: manufacturerNotes, updated_at: now })
    .eq("id", orderId);
  if (error) console.warn("Unable to update order after Echo booking", error.message);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin(request);
    const body = (await request.json()) as BookingBody;
    const { order, customer } = await getOrderAndCustomer(supabase, clean(body.orderId));
    const { shipmentRequest, meta } = buildRequest(body, order, customer);
    if (body.dryRun) return NextResponse.json({ ok: true, dryRun: true, shipmentRequest, meta });

    const response = await callEcho("/Shipments/LTL", { method: "POST", body: JSON.stringify(shipmentRequest) });
    const echoResponse = await readEchoBody(response);
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "Echo LTL shipment booking failed.", status: response.status, statusText: response.statusText, echoResponse, shipmentRequest }, { status: 502 });
    }

    const echoLoadId = extractLoadId(echoResponse);
    await markBooked(supabase, meta.orderId, meta.bolNumber, meta.carrierName, echoLoadId);
    return NextResponse.json({ ok: true, echoLoadId, bolNumber: meta.bolNumber, meta, echoResponse });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to book Echo LTL shipment." }, { status: 400 });
  }
}
