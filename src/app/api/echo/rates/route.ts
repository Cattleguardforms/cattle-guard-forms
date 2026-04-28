import { NextRequest, NextResponse } from "next/server";
import { callEcho, readEchoBody } from "@/lib/echo/client";

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
};

const FREIGHT_CLASS = "150";
const MAX_QUANTITY = 50;

type EchoRatesBody = {
  quantity?: number;
  shipToName?: string;
  shipToAddress?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  contactName?: string;
  contactPhone?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedPhone(value: unknown) {
  return clean(value).replace(/[^0-9]/g, "");
}

function getPalletPlan(quantity: number) {
  const palletCount = Math.ceil(quantity / 6);
  const fullPallets = Math.floor(quantity / 6);
  const remainder = quantity % 6;
  const unitsPerPallet = remainder ? [...Array(fullPallets).fill(6), remainder] : [...Array(fullPallets).fill(6)];

  return {
    palletCount,
    totalWeight: Math.max(105, quantity * 85 + 20),
    unitsPerPallet,
  };
}

function validateBody(body: EchoRatesBody) {
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }

  const required = [body.shipToName, body.shipToAddress, body.shipToCity, body.shipToState, body.shipToZip];
  if (required.some((value) => !clean(value))) {
    throw new Error("Ship-to name, address, city, state, and ZIP are required for Echo rates.");
  }

  return quantity;
}

function buildRatesRequest(body: EchoRatesBody, quantity: number) {
  const palletPlan = getPalletPlan(quantity);
  const today = new Date();
  const pickupDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return {
    Shipment: {
      ShipmentMode: "LTL",
      UnitOfWeight: "LB",
      PickupDate: pickupDate,
      Stops: [
        {
          StopNumber: 1,
          StopType: "Pickup",
          LocationType: "BUSINESS",
          LocationName: ORIGIN.locationName,
          AddressLine1: ORIGIN.addressLine1,
          City: ORIGIN.city,
          StateProvince: ORIGIN.stateProvince,
          PostalCode: ORIGIN.postalCode,
          CountryCode: ORIGIN.countryCode,
          ContactName: ORIGIN.contactName,
          ContactPhone: ORIGIN.contactPhone,
        },
        {
          StopNumber: 2,
          StopType: "Delivery",
          LocationType: "BUSINESS",
          LocationName: clean(body.shipToName),
          AddressLine1: clean(body.shipToAddress),
          AddressLine2: clean(body.shipToAddress2),
          City: clean(body.shipToCity),
          StateProvince: clean(body.shipToState).toUpperCase(),
          PostalCode: clean(body.shipToZip),
          CountryCode: "US",
          ContactName: clean(body.contactName) || clean(body.shipToName),
          ContactPhone: normalizedPhone(body.contactPhone),
        },
      ],
      Items: [
        {
          Description: "CowStop reusable concrete cattle guard forms",
          NmfcClass: FREIGHT_CLASS,
          Weight: palletPlan.totalWeight,
          PackageType: "PALLETS",
          PackageQuantity: palletPlan.palletCount,
          HandlingUnitType: "PALLETS",
          HandlingUnitQuantity: palletPlan.palletCount,
          HazardousMaterial: false,
        },
      ],
      References: [
        {
          ReferenceNumber: `CGF-${Date.now()}`,
        },
      ],
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EchoRatesBody;
    const quantity = validateBody(body);
    const echoRequest = buildRatesRequest(body, quantity);

    const response = await callEcho("/rates", {
      method: "POST",
      body: JSON.stringify(echoRequest),
    });

    const echoResponse = await readEchoBody(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Echo rates request failed.",
          status: response.status,
          statusText: response.statusText,
          echoRequest,
          echoResponse,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      quantity,
      freightClass: FREIGHT_CLASS,
      origin: ORIGIN,
      palletPlan: getPalletPlan(quantity),
      echoRequest,
      echoResponse,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to get Echo rates.",
      },
      { status: 400 },
    );
  }
}
