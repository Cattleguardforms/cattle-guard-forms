"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type QuoteFormData = {
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

const initialFormData: QuoteFormData = {
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

export default function QuotePage() {
  const [formData, setFormData] = useState<QuoteFormData>(initialFormData);
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

  const handleQuantityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const quantity = Number.parseInt(event.target.value, 10);
    setFormData((previous) => ({ ...previous, quantity }));
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
      `Pricing Summary:`,
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
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-semibold">CowStop Order / Request</h1>
      <p className="mb-8 text-slate-300">
        You are purchasing the reusable CowStop plastic form. The finished concrete section is what
        the form helps you make.
      </p>

      {error ? (
        <div className="mb-6 rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      ) : null}

      {success?.order_id || success?.status ? (
        <div className="mb-6 rounded border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          <p className="font-medium">Request submitted successfully.</p>
          <p>
            Order ID: <span className="font-mono">{success.order_id ?? "n/a"}</span>
          </p>
          <p>Status: {success.status ?? "received"}</p>
        </div>
      ) : null}

      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-800 p-4">
          <h2 className="mb-3 text-lg font-medium">What You Receive: CowStop Reusable Plastic Form</h2>
          <div className="flex h-48 items-center justify-center rounded border border-dashed border-emerald-500/50 bg-emerald-500/5 text-center text-sm text-slate-300">
            Green CowStop plastic form image area
          </div>
        </div>
        <div className="rounded border border-slate-800 p-4">
          <h2 className="mb-3 text-lg font-medium">What It Makes: Finished Concrete Cattle Guard Section</h2>
          <div className="flex h-48 items-center justify-center rounded border border-dashed border-sky-500/50 bg-sky-500/5 text-center text-sm text-slate-300">
            Finished concrete cattle guard section result area
          </div>
        </div>
      </section>

      <section className="mb-8 rounded border border-slate-800 p-4">
        <h2 className="mb-3 text-xl font-medium">Benefits</h2>
        <ul className="list-inside list-disc space-y-1 text-slate-200">
          <li>Reusable form system</li>
          <li>Helps reduce steel cattle guard cost</li>
          <li>Creates concrete cattle guard sections on-site</li>
          <li>Built-in hoof-stop design</li>
          <li>Flexible sizing by pouring multiple sections</li>
          <li>No rust or painting</li>
        </ul>
      </section>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="space-y-4 rounded border border-slate-800 p-4">
          <h2 className="text-xl font-medium">Product & Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-xs uppercase text-slate-400">Product</p>
              <p className="font-medium">{PRODUCT_NAME}</p>
            </div>
            <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-xs uppercase text-slate-400">Unit Price</p>
              <p className="font-medium">{currencyFormatter.format(UNIT_PRICE)}</p>
            </div>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-slate-300">Quantity (1–20)</span>
              <select
                name="quantity"
                value={formData.quantity}
                onChange={handleQuantityChange}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              >
                {Array.from({ length: 20 }, (_, index) => index + 1).map((quantity) => (
                  <option key={quantity} value={quantity}>
                    {quantity}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-xs uppercase text-slate-400">Selected Quantity</p>
              <p className="font-medium">{formData.quantity}</p>
            </div>
            <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-xs uppercase text-slate-400">Discount Percentage</p>
              <p className="font-medium">
                {pricing.discountRate > 0 ? `${(pricing.discountRate * 100).toFixed(0)}%` : "No discount"}
              </p>
            </div>
            <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-xs uppercase text-slate-400">Subtotal (Before Discount)</p>
              <p className="font-medium">{currencyFormatter.format(pricing.subtotal)}</p>
            </div>
            <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-xs uppercase text-slate-400">Discount Amount</p>
              <p className="font-medium">{currencyFormatter.format(pricing.discountAmount)}</p>
            </div>
            <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 sm:col-span-2">
              <p className="text-xs uppercase text-emerald-200">Total (After Discount)</p>
              <p className="text-lg font-semibold text-emerald-100">{currencyFormatter.format(pricing.total)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded border border-slate-800 p-4">
          <h2 className="text-xl font-medium">Customer Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email *"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First name"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last name"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </div>
        </section>

        <section className="space-y-4 rounded border border-slate-800 p-4">
          <h2 className="text-xl font-medium">Shipping / Project Location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="project_address_line1"
              value={formData.project_address_line1}
              onChange={handleChange}
              placeholder="Project address line 1"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <input
              name="project_address_line2"
              value={formData.project_address_line2}
              onChange={handleChange}
              placeholder="Project address line 2"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <input
              name="project_city"
              value={formData.project_city}
              onChange={handleChange}
              placeholder="Project city"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="project_state"
              value={formData.project_state}
              onChange={handleChange}
              placeholder="Project state"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="project_postal_code"
              value={formData.project_postal_code}
              onChange={handleChange}
              placeholder="Project postal code"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes"
              rows={4}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-100 px-4 py-2 font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit CowStop Request"}
        </button>
      </form>
    </main>
  );
}
