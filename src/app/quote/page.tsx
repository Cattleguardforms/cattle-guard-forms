"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type OrderFormData = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  quantity: number;
  project_address_line1: string;
  project_address_line2: string;
  project_city: string;
  project_state: string;
  project_postal_code: string;
  notes: string;
};

type QuoteResponse = {
  order_id?: string;
  status?: string;
  error?: string;
  errors?: string[];
};

const PRODUCT_NAME = "Cattle Guard Forms CowStop Reusable Form";
const PRODUCT_SUBMIT_NAME = "CowStop Reusable Form";
const PRODUCT_TYPE = "Cowstop";
const UNIT_PRICE = 1299;
const PRODUCT_IMAGE_SRC =
  "https://www.farmandranchexperts.com/wp-content/uploads/2024/11/Cattle-Guard-Reusable-Cow-Stop-cement-form.jpg";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const featureLinks = [
  ["Built to Reuse", "Repeat pours from one reusable form system.", "↻", "/installations#materials"],
  ["Precision Engineered", "Tight, repeatable dimensions for each section.", "◎", "/faq#sizing"],
  ["Heavy-Duty Strength", "Designed for ranch, farm, loader, and livestock traffic.", "♜", "/installations#steps"],
  ["HS-20 Rated", "Open engineering certificate and rating details.", "HS-20", "/engineering/hs20"],
  ["Save Time & Money", "Reduce freight, labor, and repeat install costs.", "$", "/quote"],
];

const initialFormData: OrderFormData = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  company: "",
  quantity: 1,
  project_address_line1: "",
  project_address_line2: "",
  project_city: "",
  project_state: "",
  project_postal_code: "",
  notes: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  return Math.min(20, Math.max(1, quantity));
}

export default function QuotePage() {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<QuoteResponse | null>(null);

  const pricing = useMemo(() => {
    const subtotal = formData.quantity * UNIT_PRICE;
    const discountRate = getDiscountRate(formData.quantity);
    const discountAmount = subtotal * discountRate;
    const total = subtotal - discountAmount;

    return { subtotal, discountRate, discountAmount, total };
  }, [formData.quantity]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const setQuantity = (quantity: number) => {
    setFormData((previous) => ({ ...previous, quantity: clampQuantity(quantity) }));
  };

  const handleQuantityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setQuantity(Number.parseInt(event.target.value, 10));
  };

  const validate = () => {
    if (!emailPattern.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (!Number.isInteger(formData.quantity) || formData.quantity < 1 || formData.quantity > 20) {
      return "Quantity must be between 1 and 20.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const pricingSummary = [
      "Pricing Summary:",
      `Product: ${PRODUCT_NAME}`,
      `Unit Price: ${currencyFormatter.format(UNIT_PRICE)}`,
      `Quantity: ${formData.quantity}`,
      `Subtotal: ${currencyFormatter.format(pricing.subtotal)}`,
      `Discount: ${(pricing.discountRate * 100).toFixed(0)}%`,
      `Discount Amount: ${currencyFormatter.format(pricing.discountAmount)}`,
      `Total: ${currencyFormatter.format(pricing.total)}`,
    ].join("\n");

    const noteParts = [formData.notes.trim(), pricingSummary].filter((value) => value.length > 0);

    try {
      setLoading(true);
      const response = await fetch("/api/quote-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          company: formData.company,
          project_address_line1: formData.project_address_line1,
          project_address_line2: formData.project_address_line2,
          project_city: formData.project_city,
          project_state: formData.project_state,
          project_postal_code: formData.project_postal_code,
          product_name: PRODUCT_SUBMIT_NAME,
          product_type: PRODUCT_TYPE,
          quantity: formData.quantity,
          notes: noteParts.join("\n\n"),
        }),
      });

      const data = (await response.json()) as QuoteResponse;

      if (!response.ok) {
        setError(data.errors?.join(" ") ?? data.error ?? "Unable to submit request right now.");
        return;
      }

      setSuccess({ order_id: data.order_id, status: data.status });
      setFormData(initialFormData);
    } catch {
      setError("An unexpected error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={href === "/quote" ? "text-green-900 underline decoration-green-800 decoration-2 underline-offset-8" : "hover:text-green-800"}>{label}</Link>
            ))}
          </nav>
          <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Request a Quote</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(34,197,94,0.22),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Shop Cattle Guard Forms</p>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">Buy the reusable form. Pour strong cattle guards on-site.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">Order the reusable CowStop form, choose your quantity, and submit your details so the team can confirm next steps, shipping, and project requirements.</p>
          </div>
          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <img src={PRODUCT_IMAGE_SRC} alt="Cattle Guard Forms CowStop reusable plastic form" className="h-full max-h-[420px] w-full rounded-[1.35rem] bg-white object-contain p-5" />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-6">
        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:grid-cols-5">
          {featureLinks.map(([title, body, icon, href]) => (
            <Link key={title} href={href} className="rounded-xl p-4 transition hover:-translate-y-1 hover:bg-green-50 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-50 text-sm font-black text-green-800">{icon}</div>
              <h3 className="mt-3 font-bold text-green-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
              <span className="mt-3 inline-flex text-xs font-bold uppercase tracking-wide text-green-800">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <form className="mx-auto max-w-7xl px-6 py-14" onSubmit={handleSubmit}>
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
            {error}
          </div>
        ) : null}

        {success?.order_id || success?.status ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <p className="font-semibold">Request submitted successfully.</p>
            <p>
              Order ID: <span className="font-mono">{success.order_id ?? "n/a"}</span>
            </p>
            <p>Status: {success.status ?? "received"}</p>
          </div>
        ) : null}

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Product</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">{PRODUCT_NAME}</h2>
              <p className="mt-4 leading-7 text-neutral-600">You are purchasing the reusable CowStop plastic form. The finished concrete cattle guard section is what this form helps you make with concrete and rebar.</p>
              <div className="mt-7 flex items-end gap-3">
                <p className="text-5xl font-black text-green-950">{currencyFormatter.format(UNIT_PRICE)}</p>
                <p className="pb-2 text-sm font-semibold text-neutral-500">per form</p>
              </div>
              <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
                Volume discounts: 5–19 units save 10%. 20 units save 25%.
              </div>
            </div>

            <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
              <h2 className="text-xl font-black text-green-950">Benefits & Product Details</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
                <li>✓ Reusable form system for multiple pours</li>
                <li>✓ Helps reduce traditional steel cattle guard cost</li>
                <li>✓ Creates concrete cattle guard sections on-site</li>
                <li>✓ Built-in hoof-stop design</li>
                <li>✓ Flexible sizing by pouring multiple sections</li>
                <li>✓ No rust, no painting, and lower long-term maintenance</li>
              </ul>
            </div>
          </aside>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="rounded-2xl bg-neutral-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-base font-black">Quantity</p>
                <div className="flex items-center overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm">
                  <button type="button" onClick={() => setQuantity(formData.quantity - 1)} className="px-4 py-2 text-xl hover:bg-neutral-100" aria-label="Decrease quantity">-</button>
                  <select name="quantity" value={formData.quantity} onChange={handleQuantityChange} className="border-x border-neutral-300 px-6 py-2 text-center font-bold outline-none">
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                  </select>
                  <button type="button" onClick={() => setQuantity(formData.quantity + 1)} className="px-4 py-2 text-xl hover:bg-neutral-100" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="font-bold">{currencyFormatter.format(pricing.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Discount {pricing.discountRate > 0 ? `(${(pricing.discountRate * 100).toFixed(0)}%)` : ""}</dt><dd className="font-bold text-emerald-700">-{currencyFormatter.format(pricing.discountAmount)}</dd></div>
                <div className="border-t border-neutral-200 pt-3"><div className="flex justify-between"><dt className="text-base font-black">Total</dt><dd className="text-3xl font-black text-green-950">{currencyFormatter.format(pricing.total)}</dd></div></div>
              </dl>
            </div>

            <div className="mt-6 grid gap-6">
              <section>
                <h2 className="text-xl font-black">Customer Details</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input required name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email *" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                  <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First name" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last name" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" className="rounded-xl border border-neutral-300 px-3 py-3" />
                </div>
              </section>

              <section>
                <h2 className="text-xl font-black">Shipping / Project Location</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input name="project_address_line1" value={formData.project_address_line1} onChange={handleChange} placeholder="Project address line 1" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                  <input name="project_address_line2" value={formData.project_address_line2} onChange={handleChange} placeholder="Project address line 2" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                  <input name="project_city" value={formData.project_city} onChange={handleChange} placeholder="Project city" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="project_state" value={formData.project_state} onChange={handleChange} placeholder="Project state" className="rounded-xl border border-neutral-300 px-3 py-3" />
                  <input name="project_postal_code" value={formData.project_postal_code} onChange={handleChange} placeholder="Project postal code" className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                  <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" rows={4} className="rounded-xl border border-neutral-300 px-3 py-3 sm:col-span-2" />
                </div>
              </section>
            </div>

            <button type="submit" disabled={loading} className="mt-8 w-full rounded-xl bg-green-800 px-5 py-4 font-black text-white shadow-lg shadow-green-950/20 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Submitting..." : "Submit CowStop Request"}
            </button>
          </section>
        </section>
      </form>
    </main>
  );
}
