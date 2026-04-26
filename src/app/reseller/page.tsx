"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type DistributorShippingMethod = "pickup" | "ship_our_account" | "ship_distributor_account";

type DistributorOrderForm = {
  distributorName: string;
  distributorEmail: string;
  distributorPhone: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
  shippingMethod: DistributorShippingMethod;
  deliveryAddress1: string;
  deliveryAddress2: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  carrierName: string;
  freightAccountNumber: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupContactEmail: string;
  requestedPickupDate: string;
  bolInstructions: string;
  notes: string;
};

const UNIT_PRICE = 750;
const COWSTOP_SPECS = {
  length: "72 in / 6 ft",
  width: "21.5 in",
  height: "16 in",
  grooveDepth: "9 in",
  formWeight: "80 lb",
};

const palletRows = [
  { count: 1, label: "1 CowStop", dimensions: "72 x 48 x 20 in", weight: "105 lb" },
  { count: 2, label: "2 CowStops", dimensions: "72 x 48 x 20 in", weight: "190 lb" },
  { count: 3, label: "3 CowStops", dimensions: "72 x 48 x 36 in", weight: "270 lb" },
  { count: 4, label: "4 CowStops", dimensions: "72 x 48 x 36 in", weight: "355 lb" },
  { count: 5, label: "5 CowStops", dimensions: "72 x 48 x 52 in", weight: "440 lb" },
  { count: 6, label: "6 CowStops", dimensions: "72 x 48 x 52 in", weight: "525 lb" },
];

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const initialForm: DistributorOrderForm = {
  distributorName: "",
  distributorEmail: "",
  distributorPhone: "",
  customerName: "",
  customerEmail: "",
  quantity: 1,
  shippingMethod: "ship_our_account",
  deliveryAddress1: "",
  deliveryAddress2: "",
  deliveryCity: "",
  deliveryState: "",
  deliveryZip: "",
  carrierName: "",
  freightAccountNumber: "",
  pickupContactName: "",
  pickupContactPhone: "",
  pickupContactEmail: "",
  requestedPickupDate: "",
  bolInstructions: "",
  notes: "",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function getDiscountRate(quantity: number) {
  if (quantity === 20) return 0.25;
  if (quantity >= 5) return 0.1;
  return 0;
}

function clampQuantity(quantity: number) {
  return Math.min(120, Math.max(1, quantity));
}

function getPalletPlan(quantity: number) {
  const plan: Array<{ pallet: number; cowStops: number; dimensions: string; weight: string }> = [];
  let remaining = quantity;
  let pallet = 1;

  while (remaining > 0) {
    const cowStops = Math.min(6, remaining);
    const row = palletRows.find((item) => item.count === cowStops) ?? palletRows[palletRows.length - 1];
    plan.push({ pallet, cowStops, dimensions: row.dimensions, weight: row.weight });
    remaining -= cowStops;
    pallet += 1;
  }

  return plan;
}

export default function ResellerPortalPage() {
  const [form, setForm] = useState<DistributorOrderForm>(initialForm);
  const [showPalletSheet, setShowPalletSheet] = useState(true);
  const [message, setMessage] = useState("");

  const palletPlan = useMemo(() => getPalletPlan(form.quantity), [form.quantity]);
  const discountRate = getDiscountRate(form.quantity);
  const subtotal = form.quantity * UNIT_PRICE;
  const discount = subtotal * discountRate;
  const total = subtotal - discount;

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "quantity" ? clampQuantity(Number.parseInt(value || "1", 10)) : value,
    }));
  }

  function setQuantity(quantity: number) {
    setForm((current) => ({ ...current, quantity: clampQuantity(quantity) }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Distributor order draft captured. Next build pass will connect this to the real order database, manufacturer handoff, and Echo booking.");
  }

  const echoSummary = [
    `Quantity: ${form.quantity} CowStop${form.quantity === 1 ? "" : "s"}`,
    ...palletPlan.map((item) => `Pallet ${item.pallet}: ${item.cowStops} CowStop${item.cowStops === 1 ? "" : "s"}, ${item.dimensions}, ${item.weight}`),
  ];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-green-800">{label}</Link>
            ))}
          </nav>
          <button type="button" onClick={() => setShowPalletSheet(true)} className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">
            Pallet Sheet
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(34,197,94,0.24),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Distributor Portal</p>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">Place distributor orders with pallet-ready shipping details.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">Choose pickup, ship on Cattle Guard Forms freight account, or ship using the distributor freight account. The pallet sheet opens automatically so Echo dimensions and weights are visible while ordering.</p>
          </div>
          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Distributor price" value={currencyFormatter.format(UNIT_PRICE)} />
              <Stat label="Max per pallet" value="6" />
              <Stat label="Current pallets" value={String(palletPlan.length)} />
            </div>
            <div className="mt-5 rounded-2xl bg-white/10 p-5 text-sm leading-7 text-green-50 ring-1 ring-white/15">
              <strong>Echo rule:</strong> use the pallet plan shown on this page. Every pallet can carry a maximum of six CowStops. Orders over six split into additional pallets.
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Order math</p>
                <h2 className="mt-2 text-3xl font-black">Distributor Pricing</h2>
              </div>
              <button type="button" onClick={() => setShowPalletSheet(true)} className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-900 hover:bg-green-100">Open Pallet Sheet</button>
            </div>
            <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-black">Quantity</p>
                <div className="flex items-center overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm">
                  <button type="button" onClick={() => setQuantity(form.quantity - 1)} className="px-4 py-2 text-xl hover:bg-neutral-100">-</button>
                  <input name="quantity" type="number" min={1} max={120} value={form.quantity} onChange={updateField} className="w-20 border-x border-neutral-300 px-4 py-2 text-center font-bold outline-none" />
                  <button type="button" onClick={() => setQuantity(form.quantity + 1)} className="px-4 py-2 text-xl hover:bg-neutral-100">+</button>
                </div>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="font-bold">{currencyFormatter.format(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Discount {discountRate > 0 ? `(${(discountRate * 100).toFixed(0)}%)` : ""}</dt><dd className="font-bold text-emerald-700">-{currencyFormatter.format(discount)}</dd></div>
                <div className="border-t border-neutral-200 pt-3"><div className="flex justify-between"><dt className="font-black">Product Total</dt><dd className="text-2xl font-black text-green-950">{currencyFormatter.format(total)}</dd></div></div>
              </dl>
            </div>
          </section>

          <section className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Product facts</p>
            <h2 className="mt-2 text-2xl font-black text-green-950">CowStop Specs</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Fact label="Length" value={COWSTOP_SPECS.length} />
              <Fact label="Width" value={COWSTOP_SPECS.width} />
              <Fact label="Height" value={COWSTOP_SPECS.height} />
              <Fact label="Weight" value={COWSTOP_SPECS.formWeight} />
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-700">Grooves are {COWSTOP_SPECS.grooveDepth} deep. Pallet dimensions below are the freight dimensions to enter into Echo.</p>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Echo-ready pallet plan</p>
            <div className="mt-4 space-y-2">
              {palletPlan.map((item) => (
                <div key={item.pallet} className="rounded-xl bg-neutral-50 p-3 text-sm">
                  <p className="font-bold text-green-900">Pallet {item.pallet}: {item.cowStops} CowStop{item.cowStops === 1 ? "" : "s"}</p>
                  <p className="text-neutral-600">{item.dimensions} • {item.weight}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
          {message ? <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-900">{message}</div> : null}

          <div className="grid gap-6">
            <section>
              <h2 className="text-2xl font-black">Distributor + Customer</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input name="distributorName" value={form.distributorName} onChange={updateField} placeholder="Distributor name" className="rounded-xl border border-neutral-300 px-3 py-3" />
                <input name="distributorEmail" type="email" value={form.distributorEmail} onChange={updateField} placeholder="Distributor email" className="rounded-xl border border-neutral-300 px-3 py-3" />
                <input name="distributorPhone" value={form.distributorPhone} onChange={updateField} placeholder="Distributor phone" className="rounded-xl border border-neutral-300 px-3 py-3" />
                <input name="customerName" value={form.customerName} onChange={updateField} placeholder="Customer / job name" className="rounded-xl border border-neutral-300 px-3 py-3" />
                <input name="customerEmail" type="email" value={form.customerEmail} onChange={updateField} placeholder="Customer email" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black">Shipping Method</h2>
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <ShippingChoice value="pickup" selected={form.shippingMethod} title="Pickup" body="Distributor/customer picks up at manufacturer." onChange={updateField} />
                <ShippingChoice value="ship_our_account" selected={form.shippingMethod} title="Ship on our account" body="Use Cattle Guard Forms freight/Echo account." onChange={updateField} />
                <ShippingChoice value="ship_distributor_account" selected={form.shippingMethod} title="Ship on distributor account" body="Distributor supplies carrier/account/BOL info." onChange={updateField} />
              </div>
            </section>

            {form.shippingMethod === "ship_our_account" ? (
              <section>
                <h2 className="text-xl font-black">Ship-To Address for Echo Quote</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input name="deliveryAddress1" value={form.deliveryAddress1} onChange={updateField} placeholder="Delivery address line 1" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                  <input name="deliveryAddress2" value={form.deliveryAddress2} onChange={updateField} placeholder="Delivery address line 2" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                  <input name="deliveryCity" value={form.deliveryCity} onChange={updateField} placeholder="City" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="deliveryState" value={form.deliveryState} onChange={updateField} placeholder="State" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="deliveryZip" value={form.deliveryZip} onChange={updateField} placeholder="ZIP" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                </div>
              </section>
            ) : null}

            {form.shippingMethod === "ship_distributor_account" ? (
              <section>
                <h2 className="text-xl font-black">Distributor Freight Account</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input name="carrierName" value={form.carrierName} onChange={updateField} placeholder="Carrier name" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="freightAccountNumber" value={form.freightAccountNumber} onChange={updateField} placeholder="Freight account number" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="pickupContactName" value={form.pickupContactName} onChange={updateField} placeholder="Pickup contact name" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="pickupContactPhone" value={form.pickupContactPhone} onChange={updateField} placeholder="Pickup contact phone" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="pickupContactEmail" value={form.pickupContactEmail} onChange={updateField} placeholder="Pickup contact email" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="requestedPickupDate" type="date" value={form.requestedPickupDate} onChange={updateField} className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <textarea name="bolInstructions" value={form.bolInstructions} onChange={updateField} placeholder="BOL instructions / carrier notes" rows={4} className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                </div>
              </section>
            ) : null}

            {form.shippingMethod === "pickup" ? (
              <section className="rounded-2xl bg-green-50 p-5 text-sm leading-7 text-green-950 ring-1 ring-green-100">
                <h2 className="text-xl font-black">Pickup Order</h2>
                <p className="mt-2">This order will be sent to the manufacturer for pickup preparation. The next build pass will add the official pickup address, pickup window, and manufacturer-ready email payload.</p>
              </section>
            ) : null}

            <section>
              <h2 className="text-xl font-black">Notes</h2>
              <textarea name="notes" value={form.notes} onChange={updateField} placeholder="Distributor order notes, customer notes, delivery notes, special handling, etc." rows={5} className="mt-5 w-full rounded-xl border border-neutral-300 px-3 py-3" />
            </section>

            <section className="rounded-2xl bg-neutral-50 p-5 text-sm leading-7 text-neutral-700">
              <p className="font-black text-neutral-950">Internal Echo Summary</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 text-xs leading-6 text-neutral-700 ring-1 ring-neutral-200">{echoSummary.join("\n")}</pre>
            </section>
          </div>

          <button type="submit" className="mt-8 w-full rounded-xl bg-green-800 px-5 py-4 font-black text-white shadow-lg shadow-green-950/20 hover:bg-green-900">
            Save Distributor Order Draft
          </button>
        </section>
      </form>

      {showPalletSheet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-6 border-b border-neutral-200 bg-white p-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Distributor shipping sheet</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Echo pallet dimensions and weights</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">Use this table when entering pallet information into Echo. Six CowStops is the maximum per pallet. Orders over six need another pallet.</p>
              </div>
              <button type="button" onClick={() => setShowPalletSheet(false)} className="rounded-full border border-neutral-300 px-4 py-2 font-black hover:bg-neutral-50">×</button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Fact label="Mold length" value={COWSTOP_SPECS.length} />
                <Fact label="Mold width" value={COWSTOP_SPECS.width} />
                <Fact label="Mold height" value={COWSTOP_SPECS.height} />
                <Fact label="Mold weight" value={COWSTOP_SPECS.formWeight} />
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                  <thead className="bg-green-950 text-white"><tr><th className="px-5 py-4">Quantity on pallet</th><th className="px-5 py-4">Echo dimensions</th><th className="px-5 py-4">Echo weight</th><th className="px-5 py-4">Rule</th></tr></thead>
                  <tbody className="divide-y divide-neutral-200">
                    {palletRows.map((row) => (
                      <tr key={row.count}><td className="px-5 py-4 font-bold text-green-950">{row.label}</td><td className="px-5 py-4">{row.dimensions}</td><td className="px-5 py-4">{row.weight}</td><td className="px-5 py-4 text-neutral-600">1 pallet</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-950 ring-1 ring-amber-200">
                Important: only six CowStops fit on one pallet. For 7 or more CowStops, start a new pallet and repeat the same 1–6 table for the remaining quantity.
              </div>

              <button type="button" onClick={() => setShowPalletSheet(false)} className="mt-6 w-full rounded-xl bg-green-800 px-5 py-4 font-black text-white hover:bg-green-900">
                I understand — continue order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/15">
      <p className="text-xs font-bold uppercase tracking-wide text-green-200">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-neutral-200">
      <p className="font-bold text-green-900">{label}</p>
      <p className="mt-1 text-neutral-700">{value}</p>
    </div>
  );
}

function ShippingChoice({ value, selected, title, body, onChange }: { value: DistributorShippingMethod; selected: DistributorShippingMethod; title: string; body: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className={`rounded-2xl border p-4 ${selected === value ? "border-green-800 bg-green-50" : "border-neutral-200"}`}>
      <input type="radio" name="shippingMethod" value={value} checked={selected === value} onChange={onChange} className="mr-2" />
      <span className="font-bold">{title}</span>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
    </label>
  );
}
