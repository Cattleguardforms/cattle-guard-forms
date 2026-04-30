"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import FreightQuotePanel from "../portal/FreightQuotePanel";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type CheckoutResponse = { url?: string; error?: string };

export default function DistributorOrderPortal() {
  const supabase = useMemo(() => (url && key ? createClient(url, key) : null), []);
  const bolRef = useRef<HTMLInputElement | null>(null);
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [method, setMethod] = useState<"echo" | "own">("echo");
  const [rate, setRate] = useState("");
  const [freight, setFreight] = useState(0);
  const [quoted, setQuoted] = useState(false);
  const [bol, setBol] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = qty * 750 + (method === "echo" ? freight : 0);

  async function token() {
    if (!supabase) throw new Error("Distributor auth unavailable.");
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Sign in through the distributor portal first.");
    return data.session.access_token;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Order contact email is required.");
    if (phone.replace(/[^0-9]/g, "").length < 10) return setError("Delivery phone is required.");
    if (!name || !addr || !city || !state || !zip) return setError("Complete ship-to information is required.");
    if (!customer) return setError("Customer name is required for warranty records.");
    if (customerPhone.replace(/[^0-9]/g, "").length < 10) return setError("Customer phone is required.");
    if (method === "echo" && (!quoted || !rate || freight <= 0)) return setError("Select a freight quote before checkout.");
    if (method === "own" && !bol) return setError("Upload the customer BOL before checkout.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("quantity", String(qty));
      fd.append("email", email);
      fd.append("shippingMethod", method);
      fd.append("shipToName", name);
      fd.append("shipToAddress", addr);
      fd.append("shipToCity", city);
      fd.append("shipToState", state);
      fd.append("shipToZip", zip);
      fd.append("contactPhone", phone);
      fd.append("deliveryType", "residential");
      fd.append("liftgateRequired", "yes");
      fd.append("selectedRate", method === "echo" ? rate : "Distributor-arranged freight");
      fd.append("freightCharge", String(method === "echo" ? freight : 0));
      fd.append("warrantyCustomerName", customer);
      fd.append("warrantyCustomerEmail", customerEmail);
      fd.append("warrantyCustomerPhone", customerPhone);
      if (bol) fd.append("bolFile", bol);
      const res = await fetch("/api/distributor-checkout", { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: fd });
      const payload = (await res.json()) as CheckoutResponse;
      if (!res.ok || !payload.url) return setError(payload.error || "Unable to start checkout.");
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950"><section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><Link href="/distributor" className="text-sm font-semibold text-green-800">Back to distributor access</Link><h1 className="mt-5 text-3xl font-black">Distributor Order Portal</h1><p className="mt-2 text-sm text-neutral-700">One clean checkout path for CGF freight or distributor-arranged freight with BOL upload.</p>{error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}<form onSubmit={submit} className="mt-6 grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Quantity<select value={qty} onChange={e=>setQty(Number(e.target.value))} className="rounded border px-3 py-2">{Array.from({length:30},(_,i)=>i+1).map(n=><option key={n}>{n}</option>)}</select></label><div className="rounded bg-green-50 p-3 text-right ring-1 ring-green-100"><p className="text-xs font-bold uppercase text-green-800">Total</p><p className="text-2xl font-black">${total.toLocaleString()}</p></div></div><div className="grid gap-4 sm:grid-cols-2"><input required placeholder="Order contact email" value={email} onChange={e=>setEmail(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Delivery phone" value={phone} onChange={e=>setPhone(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Ship-to name" value={name} onChange={e=>setName(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Address" value={addr} onChange={e=>setAddr(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="City" value={city} onChange={e=>setCity(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="State" value={state} onChange={e=>setState(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="ZIP" value={zip} onChange={e=>setZip(e.target.value)} className="rounded border px-3 py-2"/></div><div className="rounded-xl border p-4"><p className="font-bold">Customer warranty information</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><input required placeholder="Customer name" value={customer} onChange={e=>setCustomer(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Customer phone" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="rounded border px-3 py-2"/><input placeholder="Customer email optional" value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)} className="rounded border px-3 py-2 sm:col-span-2"/></div></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-blue-950">Freight method</p><label className="mt-3 block"><input type="radio" checked={method==="echo"} onChange={()=>setMethod("echo")} className="mr-2"/>Use Cattle Guard Forms freight quote</label><label className="mt-2 block"><input type="radio" checked={method==="own"} onChange={()=>setMethod("own")} className="mr-2"/>I will arrange freight / upload BOL</label></div>{method === "echo" ? <FreightQuotePanel quantity={qty} shipToName={name} shipToAddress={addr} shipToCity={city} shipToState={state} shipToZip={zip} contactPhone={phone} deliveryType="residential" liftgateRequired="yes" orderContactEmail={email} onQuoteStatusChange={setQuoted} onFreightOptionSelect={(r,c)=>{setRate(r);setFreight(c)}}/> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-950">BOL required</p><button type="button" onClick={()=>bolRef.current?.click()} className="mt-3 rounded bg-green-800 px-4 py-2 font-bold text-white">Upload Customer BOL</button><input ref={bolRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e=>setBol(e.target.files?.[0] ?? null)}/>{bol ? <p className="mt-2 text-sm font-bold text-green-900">Selected: {bol.name}</p> : <p className="mt-2 text-sm text-red-800">No BOL selected.</p>}</div>}<button disabled={busy || (method==="own" && !bol) || (method==="echo" && !quoted)} className="rounded bg-green-800 px-5 py-4 font-bold text-white disabled:opacity-50">{busy ? "Preparing..." : "Continue to Stripe"}</button></form></section></main>;
}
