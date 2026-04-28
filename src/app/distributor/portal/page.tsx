"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import FreightQuotePanel from "./FreightQuotePanel";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const palletRows = [
  { count: 1, dimensions: "72 x 48 x 20 in", weight: "105 lb" },
  { count: 2, dimensions: "72 x 48 x 20 in", weight: "190 lb" },
  { count: 3, dimensions: "72 x 48 x 36 in", weight: "270 lb" },
  { count: 4, dimensions: "72 x 48 x 36 in", weight: "355 lb" },
  { count: 5, dimensions: "72 x 48 x 52 in", weight: "440 lb" },
  { count: 6, dimensions: "72 x 48 x 52 in", weight: "525 lb" },
];

type ProfileResponse = {
  ok?: boolean;
  error?: string;
  profile?: {
    email: string;
    companyName?: string;
    pricePerUnit?: number;
  };
};

type CheckoutResponse = {
  url?: string;
  error?: string;
};

export default function DistributorPortalAuthPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState("commercial");
  const [liftgateRequired, setLiftgateRequired] = useState("no");
  const [appointmentRequired, setAppointmentRequired] = useState("no");
  const [limitedAccess, setLimitedAccess] = useState("no");
  const [hasFreightQuote, setHasFreightQuote] = useState(false);
  const [selectedFreightRate, setSelectedFreightRate] = useState("");
  const [selectedFreightCharge, setSelectedFreightCharge] = useState(0);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [returnedOrderId, setReturnedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  const unitPrice = pricePerUnit ?? 750;
  const safeQuantity = Math.min(50, Math.max(1, quantity));
  const productTotal = safeQuantity * unitPrice;
  const orderTotal = productTotal + selectedFreightCharge;
  const pallets = Math.ceil(safeQuantity / 6);

  function resetFreightSelection() {
    setHasFreightQuote(false);
    setSelectedFreightRate("");
    setSelectedFreightCharge(0);
  }

  async function verifyAccess() {
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setSignedIn(false);
      return;
    }

    const response = await fetch("/api/distributor/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as ProfileResponse;

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Approved distributor access is required.");
      await supabase.auth.signOut();
      setSignedIn(false);
      return;
    }

    setEmail(payload.profile?.email ?? "");
    setCompanyName(payload.profile?.companyName ?? "Approved Distributor");
    setPricePerUnit(payload.profile?.pricePerUnit ?? 750);
    setSignedIn(true);
  }

  useEffect(() => {
    async function init() {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        setCheckoutStatus(params.get("checkout"));
        setReturnedOrderId(params.get("order"));
      }

      if (supabase) await verifyAccess();
      setReady(true);
    }

    void init();
  }, [supabase]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        setError("Distributor sign-in is not available right now.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError("Invalid distributor credentials.");
        return;
      }

      setPassword("");
      await verifyAccess();
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError(null);

    if (!hasFreightQuote || !selectedFreightRate || selectedFreightCharge <= 0) {
      setCheckoutError("Select a freight option before payment.");
      return;
    }

    setCheckoutLoading(true);

    try {
      if (!supabase) {
        setCheckoutError("Distributor checkout is not available right now.");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setCheckoutError("Distributor session expired. Please sign in again.");
        setSignedIn(false);
        return;
      }

      const response = await fetch("/api/distributor-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: safeQuantity,
          email,
          distributorAccountName: companyName,
          shippingMethod: "echo",
          shipToName,
          shipToAddress,
          shipToCity,
          shipToState,
          shipToZip,
          contactPhone,
          deliveryType,
          liftgateRequired,
          appointmentRequired,
          limitedAccess,
          selectedRate: selectedFreightRate,
          freightCharge: selectedFreightCharge,
        }),
      });

      const payload = (await response.json()) as CheckoutResponse;
      if (!response.ok || !payload.url) {
        setCheckoutError(payload.error ?? "Unable to start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setCheckoutError("Unable to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleSignOut() {
    setSignedIn(false);
    setCompanyName("");
    setPricePerUnit(null);
    if (supabase) await supabase.auth.signOut();
  }

  if (!ready) {
    return <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-950">Loading distributor portal...</main>;
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <section className="mx-auto max-w-xl px-6 py-16">
          <Link href="/distributor" className="text-sm font-semibold text-green-800 hover:text-green-900">Back to distributor access</Link>
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Approved distributor portal</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Distributor Sign In</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">Sign in with an approved distributor account.</p>

            {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

            <form onSubmit={handleLogin} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Password
                <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-green-800 hover:text-green-900">Back to public site</Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-800">Distributor portal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Welcome, {companyName}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
              Your distributor account is active. Place CowStop orders and continue to secure checkout.
            </p>
          </div>
          <button onClick={handleSignOut} className="rounded border border-neutral-300 bg-white px-5 py-3 font-semibold hover:bg-neutral-50">Sign Out</button>
        </div>

        {checkoutStatus === "success" ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-950">
            <p className="font-bold">Payment successful. Your CowStop order was submitted.</p>
            <p className="mt-1 text-sm leading-6">
              Freight will be reviewed after order submission. {returnedOrderId ? `Order ID: ${returnedOrderId}` : ""}
            </p>
          </div>
        ) : null}

        {checkoutStatus === "cancelled" ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
            <p className="font-bold">Checkout was cancelled.</p>
            <p className="mt-1 text-sm leading-6">No payment was completed. You can review the order details and try again.</p>
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm text-neutral-500">Distributor price</p>
              <p className="mt-2 text-3xl font-bold">${unitPrice}</p>
              <p className="mt-2 text-sm text-neutral-600">Per CowStop form.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-xl font-semibold">Pallet sheet</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">Maximum six CowStops per pallet.</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600">
                    <tr>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Dimensions</th>
                      <th className="px-3 py-2">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {palletRows.map((row) => (
                      <tr key={row.count}>
                        <td className="px-3 py-2 font-semibold text-green-950">{row.count}</td>
                        <td className="px-3 py-2 text-neutral-700">{row.dimensions}</td>
                        <td className="px-3 py-2 text-neutral-700">{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-6 shadow-sm ring-1 ring-amber-200">
              <h2 className="text-xl font-semibold text-amber-950">Freight note</h2>
              <p className="mt-3 text-sm leading-6 text-amber-900">Checkout includes the selected freight & handling option.</p>
            </div>
          </aside>

          <form onSubmit={handleCheckout} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Distributor order</p>
                <h2 className="mt-2 text-3xl font-bold">Buy CowStop forms</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600">Enter the quantity and ship-to details, choose a freight option, then continue to Stripe checkout.</p>
              </div>
              <div className="rounded-xl bg-green-50 px-4 py-3 text-right ring-1 ring-green-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Order total</p>
                <p className="text-2xl font-bold text-green-950">${orderTotal.toLocaleString()}</p>
              </div>
            </div>

            {checkoutError ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{checkoutError}</div> : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Quantity
                <select required value={quantity} onChange={(event) => { setQuantity(Number(event.target.value)); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Order contact email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Delivery contact phone
                <input required type="tel" value={contactPhone} onChange={(event) => { setContactPhone(event.target.value); resetFreightSelection(); }} placeholder="555-555-5555" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Ship-to name
                <input required value={shipToName} onChange={(event) => { setShipToName(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Address
                <input required value={shipToAddress} onChange={(event) => { setShipToAddress(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">City
                <input required value={shipToCity} onChange={(event) => { setShipToCity(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">State
                <input required value={shipToState} onChange={(event) => { setShipToState(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">ZIP
                <input required value={shipToZip} onChange={(event) => { setShipToZip(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-950">Delivery details</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">These details affect the freight quote. Incorrect delivery information may cause carrier back charges.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-amber-950">Delivery location type
                  <select required value={deliveryType} onChange={(event) => { setDeliveryType(event.target.value); resetFreightSelection(); }} className="rounded border border-amber-200 bg-white px-3 py-2 font-normal text-neutral-950">
                    <option value="commercial">Commercial / business</option>
                    <option value="residential">Residential / farm / home</option>
                    <option value="job_site">Job site / construction site</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-amber-950">Liftgate required?
                  <select required value={liftgateRequired} onChange={(event) => { setLiftgateRequired(event.target.value); resetFreightSelection(); }} className="rounded border border-amber-200 bg-white px-3 py-2 font-normal text-neutral-950">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-amber-950">Appointment required?
                  <select required value={appointmentRequired} onChange={(event) => { setAppointmentRequired(event.target.value); resetFreightSelection(); }} className="rounded border border-amber-200 bg-white px-3 py-2 font-normal text-neutral-950">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-amber-950">Limited access?
                  <select required value={limitedAccess} onChange={(event) => { setLimitedAccess(event.target.value); resetFreightSelection(); }} className="rounded border border-amber-200 bg-white px-3 py-2 font-normal text-neutral-950">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700 ring-1 ring-neutral-200">
              <p className="font-semibold text-neutral-950">Order summary</p>
              <p>{safeQuantity} CowStop form{safeQuantity === 1 ? "" : "s"} at ${unitPrice} each: ${productTotal.toLocaleString()}</p>
              <p>{pallets} pallet{pallets === 1 ? "" : "s"} planned. Maximum six CowStops per pallet.</p>
              <p className="mt-2 font-medium text-neutral-950">Freight status: {hasFreightQuote ? selectedFreightRate : "Select a freight option before payment"}</p>
              {selectedFreightCharge > 0 ? <p className="font-medium text-neutral-950">Freight & handling: ${selectedFreightCharge.toLocaleString()}</p> : null}
              <p className="font-bold text-neutral-950">Total due today: ${orderTotal.toLocaleString()}</p>
            </div>

            <FreightQuotePanel
              quantity={safeQuantity}
              shipToName={shipToName}
              shipToAddress={shipToAddress}
              shipToCity={shipToCity}
              shipToState={shipToState}
              shipToZip={shipToZip}
              contactPhone={contactPhone}
              deliveryType={deliveryType}
              liftgateRequired={liftgateRequired}
              appointmentRequired={appointmentRequired}
              limitedAccess={limitedAccess}
              orderContactEmail={email}
              onQuoteStatusChange={setHasFreightQuote}
              onFreightOptionSelect={(rate, charge) => {
                setSelectedFreightRate(rate);
                setSelectedFreightCharge(charge);
              }}
            />

            <button disabled={checkoutLoading || !hasFreightQuote} className="mt-6 w-full rounded bg-green-800 px-5 py-4 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60">
              {checkoutLoading ? "Starting checkout..." : hasFreightQuote ? "Continue to Stripe Checkout" : "Select Freight Option Before Payment"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
