"use client";

import { useState } from "react";

type FreightQuotePanelProps = {
  quantity: number;
  shipToName: string;
  shipToAddress: string;
  shipToCity: string;
  shipToState: string;
  shipToZip: string;
  contactPhone: string;
  deliveryType: string;
  liftgateRequired: string;
  orderContactEmail: string;
  onQuoteStatusChange?: (hasQuote: boolean) => void;
  onFreightOptionSelect?: (selectedRate: string, freightCharge: number) => void;
};

type EchoRate = {
  CarrierName?: string;
  CarrierSCAC?: string;
  CarrierTransitDays?: number;
  TotalCharge?: number;
  CarrierGuarantee?: string;
  PointType?: string;
  ExpirationDate?: string;
  AccessorialCharge?: number;
  Accessorials?: { Type?: string; Charge?: number }[];
};

type FreightQuoteResponse = {
  ok?: boolean;
  error?: string;
  status?: number;
  statusText?: string;
  quantity?: number;
  freightClass?: string;
  palletPlan?: {
    palletCount?: number;
    totalWeight?: number;
    unitsPerPallet?: number[];
  };
  echoResponse?: unknown;
};

const MARKUP_RATE = 0.15;
const TEMP_RESIDENTIAL_LIFTGATE_SURCHARGE = 150;
const MAX_DISPLAYED_RATES = 4;
const MAX_REASONABLE_RATE = 5000;

const stateAbbreviations: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function normalizeState(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return stateAbbreviations[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function residentialLiftgateSurcharge(deliveryType: string, liftgateRequired: string) {
  return deliveryType === "residential" && liftgateRequired === "yes" ? TEMP_RESIDENTIAL_LIFTGATE_SURCHARGE : 0;
}

function customerFreightCharge(carrierCost: number, surcharge: number) {
  return Math.ceil((carrierCost * (1 + MARKUP_RATE) + surcharge) * 100) / 100;
}

function getEchoFailureDetails(quote: FreightQuoteResponse | null) {
  if (!quote) return null;
  const details = {
    status: quote.status,
    statusText: quote.statusText,
    echoResponse: quote.echoResponse,
  };
  return JSON.stringify(details, null, 2);
}

function getRates(echoResponse: unknown): EchoRate[] {
  if (!echoResponse || typeof echoResponse !== "object") return [];
  const response = echoResponse as Record<string, unknown>;
  return Array.isArray(response.Rates) ? (response.Rates as EchoRate[]) : [];
}

function isCustomerSafeRate(rate: EchoRate) {
  const carrierName = (rate.CarrierName ?? "").toLowerCase();
  const accessorials = rate.Accessorials ?? [];
  const hasBadAccessorial = accessorials.some((item) => {
    const type = (item.Type ?? "").toLowerCase();
    return type.includes("tradeshow") || type.includes("carrierembargo") || type.includes("businessdelivery");
  });

  return (
    typeof rate.TotalCharge === "number" &&
    rate.TotalCharge > 0 &&
    rate.TotalCharge < MAX_REASONABLE_RATE &&
    !carrierName.includes("trade show") &&
    !hasBadAccessorial
  );
}

function getBestRates(echoResponse: unknown) {
  return getRates(echoResponse)
    .filter(isCustomerSafeRate)
    .sort((a, b) => (a.TotalCharge ?? 0) - (b.TotalCharge ?? 0))
    .slice(0, MAX_DISPLAYED_RATES);
}

function describeRate(rate: EchoRate, charge: number, surcharge: number) {
  const carrier = rate.CarrierName ?? "Echo freight carrier";
  const transit = typeof rate.CarrierTransitDays === "number" ? `${rate.CarrierTransitDays} transit day${rate.CarrierTransitDays === 1 ? "" : "s"}` : "Transit unavailable";
  const surchargeNote = surcharge > 0 ? ` | Temporary residential liftgate surcharge ${money(surcharge)}` : "";
  return `${carrier} | ${transit} | Freight & handling ${money(charge)}${surchargeNote}`;
}

export default function FreightQuotePanel({
  quantity,
  shipToName,
  shipToAddress,
  shipToCity,
  shipToState,
  shipToZip,
  contactPhone,
  deliveryType,
  liftgateRequired,
  orderContactEmail,
  onQuoteStatusChange,
  onFreightOptionSelect,
}: FreightQuotePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FreightQuoteResponse | null>(null);
  const [selectedRateKey, setSelectedRateKey] = useState("");

  const bestRates = quote?.ok ? getBestRates(quote.echoResponse) : [];
  const temporarySurcharge = residentialLiftgateSurcharge(deliveryType, liftgateRequired);

  function resetSelectedRate() {
    setSelectedRateKey("");
    onQuoteStatusChange?.(false);
    onFreightOptionSelect?.("", 0);
  }

  async function handleGetQuote() {
    setError(null);
    setQuote(null);
    resetSelectedRate();

    if (!orderContactEmail.trim() || !orderContactEmail.includes("@") || !shipToName.trim() || !shipToAddress.trim() || !shipToCity.trim() || !shipToState.trim() || !shipToZip.trim()) {
      setError("Enter the order contact email, delivery phone, ship-to name, address, city, state, and ZIP before requesting freight.");
      return;
    }

    if (!deliveryType.trim()) {
      setError("Select the freight delivery location type before requesting an Echo quote.");
      return;
    }

    if (!liftgateRequired.trim()) {
      setError("Select whether liftgate service is required before requesting an Echo quote.");
      return;
    }

    const normalizedContactPhone = normalizePhone(contactPhone);
    if (normalizedContactPhone.length < 10) {
      setError("Enter a valid delivery contact phone number before requesting freight.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/echo/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          shipToName: shipToName.trim(),
          shipToAddress: shipToAddress.trim(),
          shipToCity: shipToCity.trim(),
          shipToState: normalizeState(shipToState),
          shipToZip: shipToZip.trim(),
          contactName: shipToName.trim(),
          contactPhone: normalizedContactPhone,
          deliveryType,
          liftgateRequired,
          orderContactEmail: orderContactEmail.trim(),
        }),
      });

      const payload = (await response.json()) as FreightQuoteResponse;
      setQuote(payload);

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to get a freight quote.");
        return;
      }
    } catch {
      setError("Unable to get a freight quote.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectRate(rate: EchoRate, index: number) {
    const carrierCost = rate.TotalCharge ?? 0;
    const charge = customerFreightCharge(carrierCost, temporarySurcharge);
    const key = `${rate.CarrierSCAC ?? rate.CarrierName ?? "rate"}-${index}-${carrierCost}`;
    setSelectedRateKey(key);
    onFreightOptionSelect?.(describeRate(rate, charge, temporarySurcharge), charge);
    onQuoteStatusChange?.(true);
  }

  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-blue-950">Freight quote</p>
          <p className="mt-1 text-sm leading-6 text-blue-900">
            Get an Echo LTL freight quote, choose one option, then checkout unlocks.
          </p>
          {temporarySurcharge > 0 ? (
            <p className="mt-2 text-sm font-semibold text-blue-950">
              Temporary residential liftgate surcharge applied: {money(temporarySurcharge)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleGetQuote}
          disabled={loading}
          className="rounded bg-blue-800 px-5 py-3 font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
        >
          {loading ? "Getting quote..." : "Get Freight Quote"}
        </button>
      </div>

      {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

      {quote && !quote.ok ? (
        <details className="mt-4 rounded border border-red-200 bg-white p-4 text-sm text-red-900">
          <summary className="cursor-pointer font-semibold">View Echo failure details</summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded bg-neutral-950 p-3 text-xs text-neutral-50">
            {getEchoFailureDetails(quote)}
          </pre>
        </details>
      ) : null}

      {quote?.ok ? (
        <div className="mt-4 rounded border border-green-200 bg-white p-4 text-sm text-neutral-800">
          <p className="font-semibold text-green-950">Freight quote received. Select one option to unlock checkout.</p>
          <p className="mt-1 text-neutral-700">
            Showing the lowest {bestRates.length} practical option{bestRates.length === 1 ? "" : "s"}. Prices include freight & handling.
          </p>
          <p className="mt-2 text-neutral-700">
            Quantity: {quote.quantity} | Freight class: {quote.freightClass} | Planned pallets: {quote.palletPlan?.palletCount}
          </p>
          {temporarySurcharge > 0 ? (
            <p className="mt-2 font-semibold text-green-950">
              Displayed prices include a temporary {money(temporarySurcharge)} residential liftgate surcharge.
            </p>
          ) : null}

          {bestRates.length ? (
            <div className="mt-4 grid gap-3">
              {bestRates.map((rate, index) => {
                const carrierCost = rate.TotalCharge ?? 0;
                const charge = customerFreightCharge(carrierCost, temporarySurcharge);
                const key = `${rate.CarrierSCAC ?? rate.CarrierName ?? "rate"}-${index}-${carrierCost}`;
                return (
                  <label key={key} className="flex cursor-pointer gap-3 rounded border border-neutral-200 bg-neutral-50 p-3 hover:bg-white">
                    <input
                      type="radio"
                      name="freightOption"
                      checked={selectedRateKey === key}
                      onChange={() => handleSelectRate(rate, index)}
                      className="mt-1"
                    />
                    <span className="flex-1">
                      <span className="block font-semibold text-neutral-950">{rate.CarrierName ?? "Echo freight carrier"}</span>
                      <span className="mt-1 block text-neutral-700">
                        {typeof rate.CarrierTransitDays === "number" ? `${rate.CarrierTransitDays} transit day${rate.CarrierTransitDays === 1 ? "" : "s"}` : "Transit unavailable"}
                        {rate.CarrierGuarantee ? ` | Service: ${rate.CarrierGuarantee}` : ""}
                      </span>
                      <span className="mt-2 block text-base font-bold text-green-950">Freight & handling: {money(charge)}</span>
                      {temporarySurcharge > 0 ? (
                        <span className="mt-1 block text-xs font-semibold text-neutral-700">
                          Includes {money(temporarySurcharge)} temporary residential liftgate surcharge.
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Echo returned rates, but none passed the customer-facing filter. Review the raw response below.
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer font-semibold text-neutral-950">View full Echo response details</summary>
            <pre className="mt-3 max-h-72 overflow-auto rounded bg-neutral-950 p-3 text-xs text-neutral-50">
              {JSON.stringify(quote.echoResponse ?? quote, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
