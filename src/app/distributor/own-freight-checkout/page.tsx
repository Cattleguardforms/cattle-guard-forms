"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type CheckoutResponse = { url?: string; error?: string };

export default function OwnFreightCheckoutPage() {
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  const total = Math.max(1, quantity) * 750;

  async function getToken() {
    if (!supabase) throw new Error("Distributor auth is not available.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Please sign in to the distributor portal first.");
    return token;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.includes("@")) return setError("Order contact email is required.");
    if (deliveryPhone.replace(/[^0-9]/g, "").length < 10) return setError("Delivery contact phone is required.");
    if (!customerName.trim()) return setError("Customer name is required for warranty records.");
    if (customerPhone.replace(/[^0-9]/g, "").length < 10) return setError("Customer phone is required for warranty records.");
    if (!shipToName.trim() || !shipToAddress.trim() || !shipToCity.trim() || !shipToState.trim() || !shipToZip.trim()) return setError("Complete ship-to information is required.");
    if (!bolFile) return setError("Upload the customer BOL before continuing to Stripe checkout.");

    setLoading(true);
    try {
      const token = await getToken();
      const body = new FormData();
      body.append("quantity", String(quantity));
      body.append("email", email.trim());
      body.append("shippingMethod", "own");
      body.append("shipToName", shipToName);
      body.append("shipToAddress", shipToAddress);
      body.append("shipToCity", shipToCity);
      body.append("shipToState", shipToState);
      body.append("shipToZip", shipToZip);
      body.append("contactPhone", deliveryPhone);
      body.append("selectedRate", "Distributor-arranged freight");
      body.append("freightCharge", "0");
      body.append("warrantyCustomerName", customerName);
      body.append("warrantyCustomerEmail", customerEmail);
      body.append("warrantyCustomerPhone", customerPhone);
      body.append("bolFile", bolFile);

      const response = await fetch("/api/distributor-checkout", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const payload = (await response.json()) as CheckoutResponse;
      if (!response.ok || !payload.url) return setError(payload.error ?? "Unable to start checkout.");
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <Link href="/distributor/portal" className="text-sm font-semibold text-green-800">Back to distributor portal</Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor arranged freight</p>
        <h1 className="mt-2 text-3xl font-black">Own freight checkout</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">Customer name and BOL are required before Stripe. The order and BOL will be emailed to the manufacturer.</p>
        {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={submit} className="mt-6 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Quantity<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded border px-3 py-2 font-normal">{Array.from({ length: 30 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <div className="rounded-lg bg-green-50 p-3 text-right ring-1 ring-green-100"><p className="text-xs font-bold uppercase text-green-800">Product total</p><p className="text-2xl font-black">${total.toLocaleString()}</p></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Order contact email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Delivery contact phone<input required value={deliveryPhone} onChange={(event) => setDeliveryPhone(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
          </div>

          <div className="rounded-xl border p-4">
            <p className="font-bold">Customer warranty information</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">Customer name<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Customer phone<input required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Customer email optional<input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="font-bold">Ship-to information</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">Ship-to name<input required value={shipToName} onChange={(event) => setShipToName(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Address<input required value={shipToAddress} onChange={(event) => setShipToAddress(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">City<input required value={shipToCity} onChange={(event) => setShipToCity(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">State<input required value={shipToState} onChange={(event) => setShipToState(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">ZIP<input required value={shipToZip} onChange={(event) => setShipToZip(event.target.value)} className="rounded border px-3 py-2 font-normal" /></label>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-bold text-amber-950">BOL upload required</p>
            <p className="mt-1 text-sm text-amber-950">Upload the customer BOL here. It will be attached to the manufacturer email.</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-4 rounded bg-green-800 px-4 py-2 text-sm font-bold text-white">Upload Customer BOL</button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => setBolFile(event.target.files?.[0] ?? null)} />
            {bolFile ? <p className="mt-2 text-sm font-bold text-green-900">Selected: {bolFile.name}</p> : <p className="mt-2 text-sm text-red-800">No BOL selected.</p>}
          </div>

          <button disabled={loading || !bolFile} className="rounded bg-green-800 px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Preparing order..." : "Email BOL and continue to Stripe"}</button>
        </form>
      </section>
    </main>
  );
}
