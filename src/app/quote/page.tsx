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

const PRODUCT_NAME = "Cattle Guard Forms CowStop Reusable Form";
const PRODUCT_SUBMIT_NAME = "CowStop Reusable Form";
const PRODUCT_TYPE = "Cowstop";
const UNIT_PRICE = 1299;
const PRODUCT_IMAGE_SRC =
  "https://www.farmandranchexperts.com/wp-content/uploads/2024/11/Cattle-Guard-Reusable-Cow-Stop-cement-form.jpg";

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
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-bold tracking-tight">
            Cattle Guard Forms
          </a>
          <nav className="flex items-center gap-6 text-sm text-neutral-600">
            <a href="/quote" className="font-medium text-neutral-950">
              CowStop
            </a>
            <span>Customer Portal</span>
            <span>Distributor Portal</span>
          </nav>
        </div>
      </header>

      <form className="mx-auto max-w-7xl px-6 py-12" onSubmit={handleSubmit}>
        {error ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        ) : null}

        {success?.order_id || success?.status ? (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <p className="font-semibold">Request submitted successfully.</p>
            <p>
              Order ID: <span className="font-mono">{success.order_id ?? "n/a"}</span>
            </p>
            <p>Status: {success.status ?? "received"}</p>
          </div>
        ) : null}

        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="relative rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <span className="absolute left-6 top-6 rounded bg-neutral-950 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Product
              </span>
              <img
                src={PRODUCT_IMAGE_SRC}
                alt="Cattle Guard Forms CowStop reusable plastic form"
                className="mx-auto mt-8 h-auto w-full max-w-2xl object-contain"
              />
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              What you receive: the reusable CowStop plastic form shown above. The concrete cattle
              guard section is what this form helps you make.
            </p>
          </div>

          <section className="pt-2">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
              CowStop reusable form
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-950">
              {PRODUCT_NAME}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">
              A reusable form system for pouring your own concrete cattle guard sections on-site.
              Designed to reduce freight costs, avoid rust, and make repeat installations easier.
            </p>

            <div className="mt-7 flex items-end gap-3">
              <p className="text-4xl font-semibold text-neutral-950">
                {currencyFormatter.format(UNIT_PRICE)}
              </p>
              <p className="pb-1 text-sm text-neutral-500">per form</p>
            </div>

            <div className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
              Volume discounts: 5–19 units save 10%. 20 units save 25%.
            </div>

            <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-base font-semibold">Quantity</p>
                <div className="flex items-center overflow-hidden rounded border border-neutral-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(formData.quantity - 1)}
                    className="px-4 py-2 text-xl hover:bg-neutral-100"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleQuantityChange}
                    className="border-x border-neutral-300 px-6 py-2 text-center font-semibold outline-none"
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
                    className="px-4 py-2 text-xl hover:bg-neutral-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Subtotal</dt>
                  <dd className="font-medium">{currencyFormatter.format(pricing.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">
                    Discount {pricing.discountRate > 0 ? `(${(pricing.discountRate * 100).toFixed(0)}%)` : ""}
                  </dt>
                  <dd className="font-medium text-emerald-700">
                    -{currencyFormatter.format(pricing.discountAmount)}
                  </dd>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between">
                    <dt className="text-base font-semibold">Total</dt>
                    <dd className="text-2xl font-semibold">{currencyFormatter.format(pricing.total)}</dd>
                  </div>
                </div>
              </dl>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit CowStop Request"}
              </button>
            </div>
          </section>
        </section>

        <section className="mt-14 border-t border-neutral-200 pt-10">
          <h2 className="text-2xl font-semibold">Description</h2>
          <div className="mt-5 max-w-5xl space-y-5 text-sm leading-7 text-neutral-700">
            <p>
              Make your own concrete cattle guard sections without paying for oversized steel
              freight. CowStop gives ranchers, farmers, contractors, and rural property owners a
              practical way to pour durable sections on-site using a reusable plastic form.
            </p>
            <p>
              You are purchasing the reusable CowStop plastic form. The finished concrete cattle
              guard section is what the form helps you create with concrete and rebar.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-xl font-semibold">Benefits & Product Details</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6 text-neutral-700">
              <li>Reusable form system for multiple pours</li>
              <li>Helps reduce traditional steel cattle guard cost</li>
              <li>Creates concrete cattle guard sections on-site</li>
              <li>Built-in hoof-stop design</li>
              <li>Flexible sizing by pouring multiple sections</li>
              <li>No rust, no painting, and lower long-term maintenance</li>
            </ul>
          </div>

          <div className="grid gap-6">
            <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Customer Details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  required
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email *"
                  className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                />
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="rounded border border-neutral-300 px-3 py-2"
                />
                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="rounded border border-neutral-300 px-3 py-2"
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="rounded border border-neutral-300 px-3 py-2"
                />
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company"
                  className="rounded border border-neutral-300 px-3 py-2"
                />
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Shipping / Project Location</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  name="project_address_line1"
                  value={formData.project_address_line1}
                  onChange={handleChange}
                  placeholder="Project address line 1"
                  className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                />
                <input
                  name="project_address_line2"
                  value={formData.project_address_line2}
                  onChange={handleChange}
                  placeholder="Project address line 2"
                  className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                />
                <input
                  name="project_city"
                  value={formData.project_city}
                  onChange={handleChange}
                  placeholder="Project city"
                  className="rounded border border-neutral-300 px-3 py-2"
                />
                <input
                  name="project_state"
                  value={formData.project_state}
                  onChange={handleChange}
                  placeholder="Project state"
                  className="rounded border border-neutral-300 px-3 py-2"
                />
                <input
                  name="project_postal_code"
                  value={formData.project_postal_code}
                  onChange={handleChange}
                  placeholder="Project postal code"
                  className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notes"
                  rows={4}
                  className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                />
              </div>
            </section>
          </div>
        </section>
      </form>
    </main>
  );
}
