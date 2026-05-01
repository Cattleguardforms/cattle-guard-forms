"use client";

import { createClient } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import FreightQuotePanel from "../components/FreightQuotePanel";
import DistributorNav from "../DistributorNav";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const palletRows = [
  [1, "72 x 48 x 20 in", "105 lb"],
  [2, "72 x 48 x 20 in", "190 lb"],
  [3, "72 x 48 x 36 in", "270 lb"],
  [4, "72 x 48 x 36 in", "355 lb"],
  [5, "72 x 48 x 52 in", "440 lb"],
  [6, "72 x 48 x 52 in", "525 lb"],
] as const;

type ProfileResponse = { ok?: boolean; error?: string; profile?: { email: string; companyName?: string } };
type CheckoutResponse = { url?: string; error?: string };
type DeliveryType = "" | "commercial" | "residential" | "limited_access" | "construction_site";
type LiftgateChoice = "" | "yes" | "no";

export default function ShopClient() {
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const bolRef = useRef<HTMLInputElement | null>(null);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shipName, setShipName] = useState("");
  const [addr, setAddr] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("");
  const [liftgateRequired, setLiftgateRequired] = useState<LiftgateChoice>("");
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
  const pallets = Math.max(1, Math.ceil(qty / 6));

  function resetQuote() {
    setQuoted(false);
    setRate("");
    setFreight(0);
  }

  async function getToken() {
    if (!supabase) throw new Error("Distributor auth unavailable.");
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Sign in first.");
    return data.session.access_token;
  }

  async function verify() {
    if (!supabase) {
      setError("Distributor auth unavailable.");
      setReady(true);
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch("/api/distributor/profile", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await res.json()) as ProfileResponse;
      if (!res.ok || !payload.ok) throw new Error(payload.error || "Approved distributor access is required.");
      const profileEmail = payload.profile?.email || "";
      setSignedIn(true);
      setCompany(payload.profile?.companyName || "Approved Distributor");
      setLoginEmail(profileEmail);
      setEmail(profileEmail);
    } catch {
      setSignedIn(false);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { void verify(); }, [supabase]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!supabase) throw new Error("Distributor sign-in is not available.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail.trim().toLowerCase(), password });
      if (signInError) throw new Error("Invalid distributor credentials.");
      setPassword("");
      await verify();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Order contact email is required.");
    if (phone.replace(/[^0-9]/g, "").length < 10) return setError("Delivery phone is required.");
    if (!shipName || !addr || !city || !state || !zip) return setError("Complete ship-to information is required.");
    if (!deliveryType) return setError("Select commercial, residential, limited access, or construction site before checkout.");
    if (!liftgateRequired) return setError("Select whether liftgate service is required before checkout.");
    if (!customer) return setError("Customer name is required for warranty records.");
    if (customerPhone.replace(/[^0-9]/g, "").length < 10) return setError("Customer phone is required.");
    if (!customerEmail.includes("@")) return setError("Customer email is required for warranty records.");
    if (method === "echo" && (!quoted || !rate || freight <= 0)) return setError("Select a freight quote before checkout.");
    if (method === "own" && !bol) return setError("Upload the customer BOL before checkout.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("quantity", String(qty));
      fd.append("email", email);
      fd.append("distributorAccountName", company);
      fd.append("shippingMethod", method);
      fd.append("shipToName", shipName);
      fd.append("shipToAddress", addr);
      fd.append("shipToCity", city);
      fd.append("shipToState", state);
      fd.append("shipToZip", zip);
      fd.append("contactPhone", phone);
      fd.append("deliveryType", deliveryType);
      fd.append("liftgateRequired", liftgateRequired);
      fd.append("selectedRate", method === "echo" ? rate : "Distributor-arranged freight");
      fd.append("freightCharge", String(method === "echo" ? freight : 0));
      fd.append("warrantyCustomerName", customer);
      fd.append("warrantyCustomerEmail", customerEmail);
      fd.append("warrantyCustomerPhone", customerPhone);
      if (bol) fd.append("bolFile", bol);
      const res = await fetch("/api/distributor-checkout", { method: "POST", headers: { Authorization: `Bearer ${await getToken()}` }, body: fd });
      const payload = (await res.json()) as CheckoutResponse;
      if (!res.ok || !payload.url) return setError(payload.error || "Unable to start checkout.");
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">Loading distributor shop...</main>;

  if (!signedIn) {
    return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950"><section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p><h1 className="mt-2 text-3xl font-black">Sign In to Shop</h1>{error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}<form onSubmit={signIn} className="mt-6 grid gap-4"><input required type="email" placeholder="Email" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} className="rounded border px-3 py-2"/><input required type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded border px-3 py-2"/><button disabled={busy} className="rounded bg-green-800 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Signing in..." : "Sign In"}</button></form></section></main>;
  }

  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950"><section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p><h1 className="mt-2 text-3xl font-black">Shop</h1><p className="mt-2 text-sm text-neutral-700">Signed in as {company}. Place a new CowStop order here.</p><DistributorNav active="shop" />{error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}<div className="mt-6 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]"><aside className="space-y-5"><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="font-bold">Pallet count, dimensions, and weight</p><p className="mt-2 text-sm text-neutral-700">Maximum six CowStops per pallet.</p><div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white"><table className="w-full text-left text-sm"><tbody>{palletRows.map(([count, dim, weight])=><tr key={count} className="border-b"><td className="px-3 py-2 font-bold">{count}</td><td className="px-3 py-2">{dim}</td><td className="px-3 py-2">{weight}</td></tr>)}</tbody></table></div><p className="mt-3 text-sm font-semibold text-green-950">Current order: {qty} CowStop form{qty === 1 ? "" : "s"} / {pallets} pallet{pallets === 1 ? "" : "s"} planned.</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-950">Why customer information is required</p><p className="mt-2 text-sm leading-6 text-amber-950">Customer name, phone, and email are required for warranty records, product traceability, and future support.</p></div></aside><form onSubmit={submit} className="grid gap-5"><div className="grid gap-4 sm:grid-cols-2"><select value={qty} onChange={e=>setQty(Number(e.target.value))} className="rounded border px-3 py-2">{Array.from({length:30},(_,i)=>i+1).map(n=><option key={n}>{n}</option>)}</select><div className="rounded bg-green-50 p-3 text-right ring-1 ring-green-100"><p className="text-xs font-bold uppercase text-green-800">Total</p><p className="text-2xl font-black">${total.toLocaleString()}</p></div></div><div className="grid gap-4 sm:grid-cols-2"><input required placeholder="Order contact email" value={email} onChange={e=>setEmail(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Delivery phone" value={phone} onChange={e=>setPhone(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Ship-to name / business / customer" value={shipName} onChange={e=>{setShipName(e.target.value); resetQuote();}} className="rounded border px-3 py-2"/><input required placeholder="Address" value={addr} onChange={e=>{setAddr(e.target.value); resetQuote();}} className="rounded border px-3 py-2"/><input required placeholder="City" value={city} onChange={e=>{setCity(e.target.value); resetQuote();}} className="rounded border px-3 py-2"/><input required placeholder="State" value={state} onChange={e=>{setState(e.target.value); resetQuote();}} className="rounded border px-3 py-2"/><input required placeholder="ZIP" value={zip} onChange={e=>{setZip(e.target.value); resetQuote();}} className="rounded border px-3 py-2"/></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-blue-950">Freight delivery requirements</p><p className="mt-1 text-sm text-blue-900">These choices affect the Echo freight quote and shipment booking.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-blue-950">Delivery location type<select required value={deliveryType} onChange={(e)=>{setDeliveryType(e.target.value as DeliveryType); resetQuote();}} className="rounded border px-3 py-2 font-normal"><option value="">Select location type</option><option value="commercial">Commercial / business with dock or forklift</option><option value="residential">Residential / farm / home delivery</option><option value="limited_access">Limited access location</option><option value="construction_site">Construction site / jobsite</option></select></label><label className="grid gap-2 text-sm font-semibold text-blue-950">Liftgate required?<select required value={liftgateRequired} onChange={(e)=>{setLiftgateRequired(e.target.value as LiftgateChoice); resetQuote();}} className="rounded border px-3 py-2 font-normal"><option value="">Select liftgate requirement</option><option value="yes">Yes - liftgate required</option><option value="no">No - forklift/dock/unloading equipment available</option></select></label></div></div><div className="rounded-xl border p-4"><p className="font-bold">Customer warranty information</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><input required placeholder="Customer name" value={customer} onChange={e=>setCustomer(e.target.value)} className="rounded border px-3 py-2"/><input required placeholder="Customer phone" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="rounded border px-3 py-2"/><input required type="email" placeholder="Customer email required" value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)} className="rounded border px-3 py-2 sm:col-span-2"/></div></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-blue-950">Freight method</p><label className="mt-3 block"><input type="radio" checked={method==="echo"} onChange={()=>{setMethod("echo"); resetQuote();}} className="mr-2"/>Use Cattle Guard Forms freight quote</label><label className="mt-2 block"><input type="radio" checked={method==="own"} onChange={()=>{setMethod("own"); resetQuote();}} className="mr-2"/>I will arrange freight / upload BOL</label></div>{method === "echo" ? <FreightQuotePanel quantity={qty} shipToName={shipName} shipToAddress={addr} shipToCity={city} shipToState={state} shipToZip={zip} contactPhone={phone} deliveryType={deliveryType} liftgateRequired={liftgateRequired} orderContactEmail={email} onQuoteStatusChange={setQuoted} onFreightOptionSelect={(r,c)=>{setRate(r);setFreight(c)}}/> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-950">BOL required</p><button type="button" onClick={()=>bolRef.current?.click()} className="mt-3 rounded bg-green-800 px-4 py-2 font-bold text-white">Upload Customer BOL</button><input ref={bolRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e=>setBol(e.target.files?.[0] ?? null)}/>{bol ? <p className="mt-2 text-sm font-bold text-green-900">Selected: {bol.name}</p> : <p className="mt-2 text-sm text-red-800">No BOL selected.</p>}</div>}<button disabled={busy || !deliveryType || !liftgateRequired || (method==="own" && !bol) || (method==="echo" && !quoted)} className="rounded bg-green-800 px-5 py-4 font-bold text-white disabled:opacity-50">{busy ? "Preparing..." : "Continue to Stripe"}</button></form></div></section></main>;
}
