"use client";

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

const PRODUCT_NAME = "CowStop Reusable Form";
const PRODUCT_TYPE = "Cowstop";
const UNIT_PRICE = 1299;
const PRODUCT_IMAGE_SRC = "data:image/png;base64,__PRODUCT_IMAGE_PLACEHOLDER__";

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

    return {
      subtotal,
      discountRate,
      discountAmount,
      total,
    };
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
          product_name: PRODUCT_NAME,
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

      setSuccess({
        order_id: data.order_id,
        status: data.status,
      });
      setFormData(initialFormData);
    } catch {
      setError("An unexpected error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a className="text-xl font-bold tracking-tight" href="/">
            Cattle Guard Forms
          </a>
          <nav className="flex items-center gap-6 text-sm text-slate-700">
            <a className="hover:text-slate-950" href="/quote">
              CowStop
            </a>
            <span className="text-slate-400">Customer Portal</span>
            <span className="text-slate-400">Distributor Portal</span>
          </nav>
        </div>
      </header>

      <form className="mx-auto max-w-7xl px-6 py-10" onSubmit={handleSubmit}>
        {error ? (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        ) : null}

        {success?.order_id || success?.status ? (
          <div className="mb-6 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <p className="font-semibold">Request submitted successfully.</p>
            <p>
              Order ID: <span className="font-mono">{success.order_id ?? "n/a"}</span>
            </p>
            <p>Status: {success.status ?? "received"}</p>
          </div>
        ) : null}

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-3 inline-flex rounded bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                Product you receive
              </div>
              <img
                src={PRODUCT_IMAGE_SRC}
                alt="CowStop reusable plastic cattle guard form"
                className="mx-auto h-auto w-full max-w-2xl rounded bg-white object-contain"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                What it makes
              </p>
              <h2 className="mt-1 text-xl font-semibold">Finished Concrete Cattle Guard Section</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You are purchasing the reusable CowStop plastic form. The finished concrete
                section is what the form helps you make using concrete and rebar.
              </p>
            </div>
          </div>

          <section className="lg:pt-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-700">
              CowStop reusable form
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Cattle Guard Forms CowStop Reusable Form
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Make your own concrete cattle guard sections on-site and avoid the high freight,
              fabrication, and maintenance costs of traditional steel cattle guards.
            </p>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-4xl font-bold text-slate-950">
                {currencyFormatter.format(UNIT_PRICE)}
              </p>
              <p className="pb-1 text-sm text-slate-500">per reusable form</p>
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Volume discounts: buy 5–19 and save 10%. Buy 20 and save 25%.
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold">Quantity</p>
                <div className="flex items-center overflow-hidden rounded border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setQuantity(formData.quantity - 1)}
                    className="px-4 py-2 text-lg hover:bg-slate-100"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleQuantityChange}
                    className="border-x border-slate-300 px-5 py-2 text-center font-semibold outline-none"
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((quantity) => (
                      <option key={quantity} value={quantity}>
                        {quantity}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setQuantity(formData.quantity + 1)}
                    className="px-4 py-2 text-lg hover:bg-slate-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-medium">{currencyFormatter.format(pricing.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Discount {pricing.discountRate > 0 ? `(${(pricing.discountRate * 100).toFixed(0)}%)` : ""}
                  </dt>
                  <dd className="font-medium text-emerald-700">
                    -{currencyFormatter.format(pricing.discountAmount)}
                  </dd>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <dt className="text-base font-semibold">Total</dt>
                    <dd className="text-xl font-bold">{currencyFormatter.format(pricing.total)}</dd>
                  </div>
                </div>
              </dl>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit CowStop Request"}
              </button>
            </div>

            <ul className="mt-6 grid gap-2 text-sm text-slate-700">
              <li>✓ Reusable form system</li>
              <li>✓ Helps reduce steel cattle guard cost</li>
              <li>✓ Creates concrete cattle guard sections on-site</li>
              <li>✓ Built-in hoof-stop design</li>
              <li>✓ Flexible sizing by pouring multiple sections</li>
            </ul>
          </section>
        </section>

        <section className="mt-14 border-t border-slate-200 pt-10">
          <h2 className="text-2xl font-bold">Description</h2>
          <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-slate-700">
            <p>
              CowStop gives ranchers, farmers, contractors, and rural property owners a practical
              way to build durable concrete cattle guard sections on-site. Instead of buying and
              shipping a heavy pre-made steel cattle guard, you can pour your own sections using a
              reusable form.
            </p>
            <p>
              Each CowStop form is designed to be used repeatedly, helping you create multiple
              concrete sections for entrances, driveways, pasture crossings, private roads, and
              equipment access points.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Customer Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                required
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email *"
                className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
              />
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="rounded border border-slate-300 px-3 py-2"
              />
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="rounded border border-slate-300 px-3 py-2"
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="rounded border border-slate-300 px-3 py-2"
              />
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company"
                className="rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Shipping / Project Location</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                name="project_address_line1"
                value={formData.project_address_line1}
                onChange={handleChange}
                placeholder="Project address line 1"
                className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
              />
              <input
                name="project_address_line2"
                value={formData.project_address_line2}
                onChange={handleChange}
                placeholder="Project address line 2"
                className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
              />
              <input
                name="project_city"
                value={formData.project_city}
                onChange={handleChange}
                placeholder="Project city"
                className="rounded border border-slate-300 px-3 py-2"
              />
              <input
                name="project_state"
                value={formData.project_state}
                onChange={handleChange}
                placeholder="Project state"
                className="rounded border border-slate-300 px-3 py-2"
              />
              <input
                name="project_postal_code"
                value={formData.project_postal_code}
                onChange={handleChange}
                placeholder="Project postal code"
                className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
              />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notes"
                rows={4}
                className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
              />
            </div>
          </div>
        </section>
      </form>
    </main>
  );
}
