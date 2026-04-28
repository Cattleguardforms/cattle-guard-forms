"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
  const total = safeQuantity * unitPrice;
  const pallets = Math.ceil(safeQuantity / 6);

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
          selectedRate: "Freight review after order",
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
              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <p>1-2 forms: 72 x 48 x 20 in</p>
                <p>3-4 forms: 72 x 48 x 36 in</p>
                <p>5-6 forms: 72 x 48 x 52 in</p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-6 shadow-sm ring-1 ring-amber-200">
              <h2 className="text-xl font-semibold text-amber-950">Freight note</h2>
              <p className="mt-3 text-sm leading-6 text-amber-900">Checkout charges product only. Freight is reviewed after order submission.</p>
            </div>
          </aside>

          <form onSubmit={handleCheckout} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Distributor order</p>
                <h2 className="mt-2 text-3xl font-bold">Buy CowStop forms</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600">Enter the quantity and ship-to details, then continue to Stripe checkout.</p>
              </div>
              <div className="rounded-xl bg-green-50 px-4 py-3 text-right ring-1 ring-green-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Product total</p>
                <p className="text-2xl font-bold text-green-950">${total.toLocaleString()}</p>
              </div>
            </div>

            {checkoutError ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{checkoutError}</div> : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Quantity
                <input required type="number" min={1} max={50} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Receipt email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Ship-to name
                <input required value={shipToName} onChange={(event) => setShipToName(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Address
                <input required value={shipToAddress} onChange={(event) => setShipToAddress(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">City
                <input required value={shipToCity} onChange={(event) => setShipToCity(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">State
                <input required value={shipToState} onChange={(event) => setShipToState(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">ZIP
                <input required value={shipToZip} onChange={(event) => setShipToZip(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
            </div>

            <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700 ring-1 ring-neutral-200">
              <p className="font-semibold text-neutral-950">Order summary</p>
              <p>{safeQuantity} CowStop form{safeQuantity === 1 ? "" : "s"} at ${unitPrice} each.</p>
              <p>{pallets} pallet{pallets === 1 ? "" : "s"} planned. Maximum six CowStops per pallet.</p>
            </div>

            <button disabled={checkoutLoading} className="mt-6 w-full rounded bg-green-800 px-5 py-4 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
              {checkoutLoading ? "Starting checkout..." : "Continue to Stripe Checkout"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
