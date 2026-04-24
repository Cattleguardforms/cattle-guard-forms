"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type QuoteFormData = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  product_name: string;
  product_type: string;
  quantity: string;
  dimensions: string;
  specifications: string;
  installation_needed: boolean;
  delivery_needed: boolean;
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
};

const initialFormData: QuoteFormData = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  company: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  product_name: "",
  product_type: "",
  quantity: "",
  dimensions: "",
  specifications: "",
  installation_needed: false,
  delivery_needed: false,
  project_address_line1: "",
  project_address_line2: "",
  project_city: "",
  project_state: "",
  project_postal_code: "",
  notes: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuotePage() {
  const [formData, setFormData] = useState<QuoteFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<QuoteResponse | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormData((previous) => ({ ...previous, [name]: checked }));
  };

  const validate = () => {
    if (!emailPattern.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (formData.quantity.trim().length > 0) {
      const quantity = Number(formData.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return "Quantity must be a positive integer.";
      }
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

    try {
      setLoading(true);
      const response = await fetch("/api/quote-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity:
            formData.quantity.trim().length > 0
              ? Number.parseInt(formData.quantity, 10)
              : null,
        }),
      });

      const data = (await response.json()) as QuoteResponse;

      if (!response.ok) {
        setError(data.error ?? "Unable to submit quote request right now.");
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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Request a Quote</h1>
      <p className="mb-8 text-slate-300">
        Fill out this form and our team will review your request.
      </p>

      {error ? (
        <div className="mb-6 rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      ) : null}

      {success?.order_id || success?.status ? (
        <div className="mb-6 rounded border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          <p className="font-medium">Quote request submitted successfully.</p>
          <p>
            Order ID: <span className="font-mono">{success.order_id ?? "n/a"}</span>
          </p>
          <p>Status: {success.status ?? "received"}</p>
        </div>
      ) : null}

      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Customer Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email *"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
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
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <input
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="Address line 1"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <input
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Address line 2"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              placeholder="Postal code"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium">Order / Request Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              placeholder="Product name"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="product_type"
              value={formData.product_type}
              onChange={handleChange}
              placeholder="Product type"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Quantity"
              inputMode="numeric"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <input
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="Dimensions"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              placeholder="Specifications"
              rows={3}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                name="installation_needed"
                checked={formData.installation_needed}
                onChange={handleCheckboxChange}
              />
              Installation needed
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                name="delivery_needed"
                checked={formData.delivery_needed}
                onChange={handleCheckboxChange}
              />
              Delivery needed
            </label>
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
              placeholder="Additional notes"
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
          {loading ? "Submitting..." : "Submit Quote Request"}
        </button>
      </form>
    </main>
  );
}
