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
  const pickUpDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    PickUpDate: pickUpDate,
    PalletQuantity: palletPlan.palletCount,
    UnitOfWeight: "LB",

    OriginLocationName: ORIGIN.locationName,
    OriginAddressLine1: ORIGIN.addressLine1,
    OriginCity: ORIGIN.city,
    OriginStateProvince: ORIGIN.stateProvince,
    OriginPostalCode: ORIGIN.postalCode,
    OriginCountryCode: ORIGIN.countryCode,
    OriginContactName: ORIGIN.contactName,
    OriginContactPhone: ORIGIN.contactPhone,

    DestinationLocationName: clean(body.shipToName),
    DestinationAddressLine1: clean(body.shipToAddress),
    DestinationAddressLine2: clean(body.shipToAddress2),
    DestinationCity: clean(body.shipToCity),
    DestinationStateProvince: clean(body.shipToState).toUpperCase(),
    DestinationPostalCode: clean(body.shipToZip),
    DestinationCountryCode: "US",
    DestinationContactName: clean(body.contactName) || clean(body.shipToName),
    DestinationContactPhone: normalizedPhone(body.contactPhone),

    Items: [
      {
        Description: "CowStop reusable concrete cattle guard forms",
        FreightClass: FREIGHT_CLASS,
        Class: FREIGHT_CLASS,
        Weight: palletPlan.totalWeight,
        Quantity: palletPlan.palletCount,
        PackageType: "PALLETS",
        PackageQuantity: palletPlan.palletCount,
        HandlingUnitType: "PALLETS",
        HandlingUnitQuantity: palletPlan.palletCount,
        HazardousMaterial: false,
      },
    ],
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Echo rates endpoint is live. Submit a POST request from the distributor portal to request freight rates.",
    method: "POST",
    requiredFields: [
      "quantity",
      "shipToName",
      "shipToAddress",
      "shipToCity",
      "shipToState",
      "shipToZip",
    ],
  });
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
          echoResponse,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      quantity,
      freightClass: FREIGHT_CLASS,
      palletPlan: getPalletPlan(quantity),
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
