"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";

type ContactFormData = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
};

const initialFormData: ContactFormData = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  company: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/contact-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; order_id?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Unable to submit contact request right now.");
        return;
      }

      setSuccess(`Message received. CRM record created${data.order_id ? `: ${data.order_id}` : "."}`);
      setFormData(initialFormData);
    } catch {
      setError("Unexpected error while submitting contact request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700" aria-label="Primary navigation">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/contact" className="text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Contact us</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Talk to Cattle Guard Forms</h1>
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            Send us your question, project details, distributor interest, or CowStop order request. Every contact submission is pulled into the CRM so the team can follow up, track history, and connect future orders to the right contact or company.
          </p>
          <div className="mt-6 rounded-xl bg-green-50 p-5 text-sm leading-6 text-green-900 ring-1 ring-green-200">
            This form creates or updates a CRM contact by email and creates a contact inquiry record for admin follow-up.
          </div>

          <section className="mt-6 rounded-2xl bg-neutral-50 p-6 ring-1 ring-neutral-200" aria-labelledby="support-heading">
            <h2 id="support-heading" className="text-2xl font-semibold">Support & Legal Information</h2>
            <p className="mt-3 leading-7 text-neutral-700">
              For order help, distributor questions, accessibility assistance, or general support, use the contact form or email support directly.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href="mailto:support@cattleguardforms.com" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
                Email Support
              </a>
              <Link href="/terms" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-white">
                Terms & Conditions
              </Link>
              <Link href="/accessibility" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-white sm:col-span-2">
                Accessibility Statement
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-500">
              By submitting the contact form, you agree that Cattle Guard Forms may use your information to respond to your request, manage customer/distributor records, and follow up through our CRM.
            </p>
          </section>
        </div>

        <form className="rounded-2xl bg-neutral-50 p-6 shadow-sm ring-1 ring-neutral-200" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-semibold">Contact Form</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Review our <Link href="/terms" className="font-semibold text-green-800 underline">Terms and Conditions</Link> before submitting if you have questions about website use, orders, distributor access, or submitted information.
          </p>

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          ) : null}
          {success ? (
            <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-neutral-700 sm:col-span-2">
              Email *
              <input required name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email *" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-700">
              First name
              <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First name" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-700">
              Last name
              <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last name" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-700">
              Phone
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-700">
              Company
              <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-700 sm:col-span-2">
              Subject
              <input name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-700 sm:col-span-2">
              How can we help? *
              <textarea required name="message" value={formData.message} onChange={handleChange} placeholder="How can we help?" rows={6} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
            </label>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Submitting..." : "Submit Contact Request"}
          </button>
        </form>
      </section>
    </main>
  );
}
