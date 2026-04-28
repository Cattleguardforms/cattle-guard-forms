"use client";

import { useState } from "react";

type FreightQuotePanelProps = {
  quantity: number;
  shipToName: string;
  shipToAddress: string;
  shipToCity: string;
  shipToState: string;
  shipToZip: string;
  onQuoteStatusChange?: (hasQuote: boolean) => void;
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

function getReadableRateSummary(echoResponse: unknown) {
  if (!echoResponse || typeof echoResponse !== "object") return "Echo response received.";

  const response = echoResponse as Record<string, unknown>;
  const candidates = [response.Rates, response.RateQuotes, response.CarrierRates, response.Quotes, response.Results];
  const firstList = candidates.find(Array.isArray) as unknown[] | undefined;

  if (!firstList?.length) return "Echo response received. Review the details below.";

  return `${firstList.length} freight option${firstList.length === 1 ? "" : "s"} returned by Echo.`;
}

export default function FreightQuotePanel({
  quantity,
  shipToName,
  shipToAddress,
  shipToCity,
  shipToState,
  shipToZip,
  onQuoteStatusChange,
}: FreightQuotePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FreightQuoteResponse | null>(null);

  async function handleGetQuote() {
    setError(null);
    setQuote(null);
    onQuoteStatusChange?.(false);

    if (!shipToName.trim() || !shipToAddress.trim() || !shipToCity.trim() || !shipToState.trim() || !shipToZip.trim()) {
      setError("Enter the ship-to name, address, city, state, and ZIP before requesting freight.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/echo/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          shipToName,
          shipToAddress,
          shipToCity,
          shipToState,
          shipToZip,
          contactName: shipToName,
        }),
      });

      const payload = (await response.json()) as FreightQuoteResponse;
      setQuote(payload);

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to get a freight quote.");
        onQuoteStatusChange?.(false);
        return;
      }

      onQuoteStatusChange?.(true);
    } catch {
      setError("Unable to get a freight quote.");
      onQuoteStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-blue-950">Freight quote</p>
          <p className="mt-1 text-sm leading-6 text-blue-900">
            Get an Echo LTL freight quote before checkout. Stripe remains product-only for now.
          </p>
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

      {quote?.ok ? (
        <div className="mt-4 rounded border border-green-200 bg-white p-4 text-sm text-neutral-800">
          <p className="font-semibold text-green-950">Freight quote received.</p>
          <p className="mt-1">{getReadableRateSummary(quote.echoResponse)}</p>
          <p className="mt-2 text-neutral-700">
            Quantity: {quote.quantity} | Freight class: {quote.freightClass} | Planned pallets: {quote.palletPlan?.palletCount}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold text-neutral-950">View Echo response details</summary>
            <pre className="mt-3 max-h-72 overflow-auto rounded bg-neutral-950 p-3 text-xs text-neutral-50">
              {JSON.stringify(quote.echoResponse ?? quote, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
