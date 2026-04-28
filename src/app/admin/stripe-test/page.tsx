"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabaseAuth = Boolean(supabaseUrl && supabaseKey);

type ShippingMethod = "echo" | "own";

type TestResponse = {
  ok?: boolean;
  error?: string;
  url?: string;
  orderId?: string;
  stripeSessionId?: string;
};

export default function AdminStripeTestPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [distributorEmail, setDistributorEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("echo");
  const [shipToName, setShipToName] = useState("Test Recipient");
  const [shipToAddress, setShipToAddress] = useState("123 Sandbox Rd");
  const [shipToAddress2, setShipToAddress2] = useState("");
  const [shipToCity, setShipToCity] = useState("Orlando");
  const [shipToState, setShipToState] = useState("FL");
  const [shipToZip, setShipToZip] = useState("32801");
  const [selectedRate, setSelectedRate] = useState("sandbox-freight-rate");
  const [bolFileName, setBolFileName] = useState("sandbox-bol.pdf");
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResponse | null>(null);

  const supabase = useMemo(() => {
    if (!hasSupabaseAuth || !supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  useEffect(() => {
    async function checkSession() {
      if (!supabase) {
        setSessionReady(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSignedIn(Boolean(data.session));
      setAdminEmail(data.session?.user.email ?? "");
      setSessionReady(true);
    }

    void checkSession();
  }, [supabase]);

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoginLoading(true);

    try {
      if (!supabase) {
        setError("Admin authentication is not available in this environment.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      });

      if (signInError) {
        setError("Invalid admin credentials.");
        return;
      }

      setSignedIn(Boolean(data.session));
      setAdminPassword("");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      if (!supabase) {
        setError("Admin authentication is not available in this environment.");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setSignedIn(false);
        setError("Admin session expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/admin/stripe-test-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          distributorEmail,
          quantity,
          shippingMethod,
          shipToName,
          shipToAddress,
          shipToAddress2,
          shipToCity,
          shipToState,
          shipToZip,
          selectedRate,
          bolFileName,
        }),
      });

      const payload = (await response.json()) as TestResponse;
      setResult(payload);

      if (!response.ok || !payload.ok || !payload.url) {
        setError(payload.error ?? "Unable to start sandbox checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Unable to start sandbox checkout.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionReady) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-950">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Loading admin session</p>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <section className="mx-auto max-w-xl px-6 py-16">
          <Link href="/admin" className="text-sm font-semibold text-green-800 hover:text-green-900">← Back to Admin</Link>
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Protected test tool</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Admin Sign In Required</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              This sandbox checkout tool is only for authorized admin testing.
            </p>
            {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
            <form onSubmit={handleAdminLogin} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Admin email
                <input required type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Password
                <input required type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <button disabled={loginLoading} className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
                {loginLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-green-800 hover:text-green-900">← Back to Admin</Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-800">Stripe sandbox test</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Stripe Sandbox Checkout</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
              Use this internal tool to test the hardened distributor checkout path without exposing distributor ordering publicly. It creates a pending Supabase order, starts Stripe sandbox checkout, and sends metadata.orderId for the webhook.
            </p>
          </div>
          <Link href="/admin/orders" className="rounded border border-green-800 px-5 py-3 font-semibold text-green-900 hover:bg-green-50">View Orders</Link>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {result?.orderId ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            Created test order: <span className="font-semibold">{result.orderId}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-neutral-700 md:col-span-2">Approved distributor email
              <input required type="email" value={distributorEmail} onChange={(event) => setDistributorEmail(event.target.value)} placeholder="distributor@example.com" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-neutral-700">Quantity
              <input required min={1} max={50} type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-neutral-700">Shipping method
              <select value={shippingMethod} onChange={(event) => setShippingMethod(event.target.value as ShippingMethod)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                <option value="echo">Cattle Guard Forms freight quote</option>
                <option value="own">Own shipper / BOL</option>
              </select>
            </label>

            {shippingMethod === "echo" ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-neutral-700 md:col-span-2">Ship-to name
                  <input required value={shipToName} onChange={(event) => setShipToName(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700 md:col-span-2">Ship-to address
                  <input required value={shipToAddress} onChange={(event) => setShipToAddress(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700 md:col-span-2">Address line 2
                  <input value={shipToAddress2} onChange={(event) => setShipToAddress2(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
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
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Sandbox freight option
                  <input required value={selectedRate} onChange={(event) => setSelectedRate(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
                </label>
              </>
            ) : (
              <label className="grid gap-2 text-sm font-medium text-neutral-700 md:col-span-2">Sandbox BOL file name
                <input required value={bolFileName} onChange={(event) => setBolFileName(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
            )}
          </div>

          <button disabled={loading} className="mt-6 rounded bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
            {loading ? "Starting sandbox checkout..." : "Start Stripe Sandbox Checkout"}
          </button>
        </form>
      </section>
    </main>
  );
}
