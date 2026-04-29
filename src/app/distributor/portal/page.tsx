"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type DistributorOrder = {
  id: string;
  shortId: string;
  quantity: number;
  quantityLabel: string;
  total: number;
  paymentStatus: string;
  checkoutStatus: string;
  shipmentStatus: string;
  status: string;
  shippingMethod: string;
  selectedRate: string;
  freightCharge: number;
  carrier: string;
  bolNumber: string;
  trackingLink: string;
  shipTo: string;
  createdAt: string;
};

type OrderFile = {
  id: string;
  order_id: string;
  file_type: "original_bol" | "signed_bol" | "shipping_document" | "other_order_attachment";
  file_name: string;
  created_at?: string | null;
};

type DistributorOrdersPayload = {
  ok?: boolean;
  error?: string;
  orders?: DistributorOrder[];
};

type OrderFilesPayload = {
  ok?: boolean;
  error?: string;
  files?: OrderFile[];
  file?: OrderFile;
  url?: string;
};

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fileTypeLabel(type: OrderFile["file_type"]) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function OrderFileUploadButton({
  label,
  fileType,
  orderId,
  disabled,
  onUpload,
}: {
  label: string;
  fileType: OrderFile["file_type"];
  orderId: string;
  disabled: boolean;
  onUpload: (orderId: string, fileType: OrderFile["file_type"], file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="rounded border border-green-800 px-3 py-2 text-xs font-bold text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40">
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(orderId, fileType, file);
          event.target.value = "";
        }}
      />
    </>
  );
}

export default function DistributorPortalAuthPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [orderContactEmail, setOrderContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<"echo" | "own">("echo");
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState("residential");
  const [liftgateRequired, setLiftgateRequired] = useState("yes");
  const [hasFreightQuote, setHasFreightQuote] = useState(false);
  const [selectedFreightRate, setSelectedFreightRate] = useState("");
  const [selectedFreightCharge, setSelectedFreightCharge] = useState(0);
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filesByOrder, setFilesByOrder] = useState<Record<string, OrderFile[]>>({});
  const [busyFileAction, setBusyFileAction] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [returnedOrderId, setReturnedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  async function getToken() {
    if (!supabase) throw new Error("Distributor auth is not available right now.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Distributor session expired. Please sign in again.");
    return token;
  }

  async function loadOrderFiles(orderId: string) {
    try {
      const token = await getToken();
      const response = await fetch(`/api/order-files?orderId=${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load order files.");
      setFilesByOrder((current) => ({ ...current, [orderId]: payload.files ?? [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order files.");
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/distributor/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as DistributorOrdersPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load open orders.");
      const nextOrders = payload.orders ?? [];
      setOrders(nextOrders);
      await Promise.all(nextOrders.map((order) => loadOrderFiles(order.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load open orders.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function uploadOrderFile(orderId: string, fileType: OrderFile["file_type"], file: File) {
    setBusyFileAction(`${orderId}:${fileType}`);
    setNotice(null);
    setError(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("fileType", fileType);
      formData.append("file", file);
      const response = await fetch("/api/order-files", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to upload file.");
      setNotice(`Uploaded ${fileTypeLabel(fileType)} for order ${orderId.slice(0, 8)}.`);
      await loadOrderFiles(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload file.");
    } finally {
      setBusyFileAction(null);
    }
  }

  async function downloadOrderFile(file: OrderFile) {
    setBusyFileAction(`download:${file.id}`);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`/api/order-files/download?fileId=${encodeURIComponent(file.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as OrderFilesPayload;
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error ?? "Unable to download file.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download file.");
    } finally {
      setBusyFileAction(null);
    }
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

    const profileEmail = payload.profile?.email ?? "";
    setEmail(profileEmail);
    setOrderContactEmail(profileEmail);
    setCompanyName(payload.profile?.companyName ?? "Approved Distributor");
    setPricePerUnit(payload.profile?.pricePerUnit ?? 750);
    setSignedIn(true);
    await loadOrders();
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
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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

    if (!orderContactEmail.trim() || !orderContactEmail.includes("@")) {
      setCheckoutError("Order contact email is required before payment.");
      return;
    }
    if (contactPhone.replace(/[^0-9]/g, "").length < 10) {
      setCheckoutError("Delivery contact phone is required before payment.");
      return;
    }
    if (!shipToName.trim() || !shipToAddress.trim() || !shipToCity.trim() || !shipToState.trim() || !shipToZip.trim()) {
      setCheckoutError("Ship-to name, address, city, state, and ZIP are required before payment.");
      return;
    }
    if (shippingMethod === "echo" && (!hasFreightQuote || !selectedFreightRate || selectedFreightCharge <= 0)) {
      setCheckoutError("Select a freight option before payment, or choose distributor-arranged freight.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/distributor-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quantity: safeQuantity,
          email: orderContactEmail.trim(),
          distributorAccountName: companyName,
          shippingMethod,
          shipToName,
          shipToAddress,
          shipToCity,
          shipToState,
          shipToZip,
          contactPhone,
          deliveryType,
          liftgateRequired,
          selectedRate: shippingMethod === "echo" ? selectedFreightRate : "Distributor-arranged freight",
          freightCharge: shippingMethod === "echo" ? selectedFreightCharge : 0,
        }),
      });
      const payload = (await response.json()) as CheckoutResponse;
      if (!response.ok || !payload.url) {
        setCheckoutError(payload.error ?? "Unable to start checkout.");
        return;
      }
      window.location.href = payload.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Unable to start checkout.");
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

  if (!ready) return <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-950">Loading distributor portal...</main>;

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
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">Your distributor account is active. Place CowStop orders, manage open orders, and upload shipping documents.</p>
          </div>
          <button onClick={handleSignOut} className="rounded border border-neutral-300 bg-white px-5 py-3 font-semibold hover:bg-neutral-50">Sign Out</button>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">{notice}</div> : null}
        {checkoutStatus === "success" ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-950"><p className="font-bold">Payment successful. Your CowStop order was submitted.</p><p className="mt-1 text-sm leading-6">{returnedOrderId ? `Order ID: ${returnedOrderId}` : ""}</p></div> : null}
        {checkoutStatus === "cancelled" ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950"><p className="font-bold">Checkout was cancelled.</p><p className="mt-1 text-sm leading-6">No payment was completed. You can review the order details and try again.</p></div> : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm text-neutral-500">Distributor price</p>
              <p className="mt-2 text-3xl font-bold">${unitPrice}</p>
              <p className="mt-2 text-sm text-neutral-600">Per CowStop form.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Open orders</h2>
                <button type="button" onClick={() => void loadOrders()} className="rounded border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-50">Refresh</button>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Upload BOLs, shipping docs, or download available order files.</p>
              <div className="mt-4 space-y-4">
                {ordersLoading ? <p className="text-sm text-neutral-600">Loading open orders...</p> : null}
                {!ordersLoading && orders.length === 0 ? <p className="text-sm text-neutral-600">No open orders found yet.</p> : null}
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-green-950">Order {order.shortId}</p>
                        <p className="mt-1 text-xs text-neutral-600">{order.quantityLabel} · {money(order.total)} · {order.status || "pending"}</p>
                        <p className="mt-1 text-xs text-neutral-600">{order.shipTo}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">{order.paymentStatus || "pending"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <OrderFileUploadButton label="Upload BOL" fileType="original_bol" orderId={order.id} disabled={Boolean(busyFileAction)} onUpload={uploadOrderFile} />
                      <OrderFileUploadButton label="Upload Signed BOL" fileType="signed_bol" orderId={order.id} disabled={Boolean(busyFileAction)} onUpload={uploadOrderFile} />
                      <OrderFileUploadButton label="Upload Shipping Doc" fileType="shipping_document" orderId={order.id} disabled={Boolean(busyFileAction)} onUpload={uploadOrderFile} />
                    </div>
                    <div className="mt-3 space-y-1">
                      {(filesByOrder[order.id] ?? []).length === 0 ? <p className="text-xs text-neutral-500">No files uploaded yet.</p> : null}
                      {(filesByOrder[order.id] ?? []).map((file) => (
                        <button key={file.id} type="button" onClick={() => void downloadOrderFile(file)} className="block text-left text-xs font-bold text-green-800 hover:underline">
                          {fileTypeLabel(file.file_type)}: {file.file_name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-xl font-semibold">Pallet sheet</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">Maximum six CowStops per pallet.</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Dimensions</th><th className="px-3 py-2">Weight</th></tr></thead><tbody className="divide-y divide-neutral-200">{palletRows.map((row) => <tr key={row.count}><td className="px-3 py-2 font-semibold text-green-950">{row.count}</td><td className="px-3 py-2 text-neutral-700">{row.dimensions}</td><td className="px-3 py-2 text-neutral-700">{row.weight}</td></tr>)}</tbody></table>
              </div>
            </div>
          </aside>

          <form onSubmit={handleCheckout} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div><p className="text-sm font-semibold uppercase tracking-wide text-green-800">Distributor order</p><h2 className="mt-2 text-3xl font-bold">Buy CowStop forms</h2><p className="mt-3 text-sm leading-6 text-neutral-600">Enter the quantity and ship-to details, choose CGF freight or arrange your own freight, then continue to Stripe checkout.</p></div>
              <div className="rounded-xl bg-green-50 px-4 py-3 text-right ring-1 ring-green-100"><p className="text-xs font-semibold uppercase tracking-wide text-green-800">Order total</p><p className="text-2xl font-bold text-green-950">${orderTotal.toLocaleString()}</p></div>
            </div>
            {checkoutError ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{checkoutError}</div> : null}

            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-950">Contact information</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Order contact email<input required type="email" value={orderContactEmail} onChange={(event) => setOrderContactEmail(event.target.value)} className="rounded border border-neutral-300 bg-white px-3 py-2 font-normal" /></label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Delivery contact phone<input required type="tel" value={contactPhone} onChange={(event) => { setContactPhone(event.target.value); resetFreightSelection(); }} placeholder="555-555-5555" className="rounded border border-neutral-300 bg-white px-3 py-2 font-normal" /></label>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
              <p className="font-semibold text-neutral-950">Order and shipping information</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Quantity<select required value={quantity} onChange={(event) => { setQuantity(Number(event.target.value)); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal">{Array.from({ length: 30 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Ship-to name<input required value={shipToName} onChange={(event) => { setShipToName(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Address<input required value={shipToAddress} onChange={(event) => { setShipToAddress(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">City<input required value={shipToCity} onChange={(event) => { setShipToCity(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">State<input required value={shipToState} onChange={(event) => { setShipToState(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">ZIP<input required value={shipToZip} onChange={(event) => { setShipToZip(event.target.value); resetFreightSelection(); }} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-blue-950">Shipping choice</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="cursor-pointer rounded border border-blue-200 bg-white p-3"><input type="radio" name="shippingMethod" checked={shippingMethod === "echo"} onChange={() => { setShippingMethod("echo"); resetFreightSelection(); }} className="mr-2" />Use Cattle Guard Forms freight quote</label>
                <label className="cursor-pointer rounded border border-blue-200 bg-white p-3"><input type="radio" name="shippingMethod" checked={shippingMethod === "own"} onChange={() => { setShippingMethod("own"); setHasFreightQuote(true); setSelectedFreightRate("Distributor-arranged freight"); setSelectedFreightCharge(0); }} className="mr-2" />I will arrange freight / send my own BOL</label>
              </div>
            </div>

            {shippingMethod === "echo" ? (
              <>
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-950">Delivery details</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-amber-950">Delivery location type<select required value={deliveryType} onChange={(event) => { setDeliveryType(event.target.value); resetFreightSelection(); }} className="rounded border border-amber-200 bg-white px-3 py-2 font-normal text-neutral-950"><option value="residential">Residential / farm / home</option><option value="commercial">Commercial / business</option></select></label>
                    <label className="grid gap-2 text-sm font-medium text-amber-950">Liftgate required?<select required value={liftgateRequired} onChange={(event) => { setLiftgateRequired(event.target.value); resetFreightSelection(); }} className="rounded border border-amber-200 bg-white px-3 py-2 font-normal text-neutral-950"><option value="yes">Yes</option><option value="no">No</option></select></label>
                  </div>
                </div>
                <FreightQuotePanel quantity={safeQuantity} shipToName={shipToName} shipToAddress={shipToAddress} shipToCity={shipToCity} shipToState={shipToState} shipToZip={shipToZip} contactPhone={contactPhone} deliveryType={deliveryType} liftgateRequired={liftgateRequired} orderContactEmail={orderContactEmail} onQuoteStatusChange={setHasFreightQuote} onFreightOptionSelect={(rate, charge) => { setSelectedFreightRate(rate); setSelectedFreightCharge(charge); }} />
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="font-bold">Distributor-arranged freight selected.</p>
                <p className="mt-1">Checkout will charge product only. Upload your BOL or shipping document from Open Orders after the order is created.</p>
              </div>
            )}

            <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700 ring-1 ring-neutral-200">
              <p className="font-semibold text-neutral-950">Order summary</p>
              <p>{safeQuantity} CowStop form{safeQuantity === 1 ? "" : "s"} at ${unitPrice} each: ${productTotal.toLocaleString()}</p>
              <p>{pallets} pallet{pallets === 1 ? "" : "s"} planned.</p>
              <p className="mt-2 font-medium text-neutral-950">Freight status: {shippingMethod === "own" ? "Distributor-arranged freight" : hasFreightQuote ? selectedFreightRate : "Select a freight option before payment"}</p>
              {selectedFreightCharge > 0 ? <p className="font-medium text-neutral-950">Freight & handling: ${selectedFreightCharge.toLocaleString()}</p> : null}
              <p className="font-bold text-neutral-950">Total due today: ${orderTotal.toLocaleString()}</p>
            </div>

            <button disabled={checkoutLoading || (shippingMethod === "echo" && !hasFreightQuote)} className="mt-6 w-full rounded bg-green-800 px-5 py-4 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60">
              {checkoutLoading ? "Starting checkout..." : shippingMethod === "own" ? "Continue to Product Checkout" : hasFreightQuote ? "Continue to Stripe Checkout" : "Select Freight Option Before Payment"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
