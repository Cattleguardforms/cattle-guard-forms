"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { companyBusinessProfile, formatCompanyAddress } from "@/lib/company/business-profile";

type ContactFormData = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  order_id: string;
};

type SupportResponse = {
  ok?: boolean;
  error?: string;
  supportId?: string;
};

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const supportCards = [
  { title: "Quote and order help", body: "Ask about CowStop forms, quantity, pricing, freight, pickup, or order next steps." },
  { title: "Distributor questions", body: "Request distributor support, account help, order routing, or wholesale program information." },
  { title: "Shipping and BOL support", body: "Send tracking, BOL, delivery, carrier, freight, or manufacturer shipping questions." },
];

const initialFormData: ContactFormData = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  company: "",
  subject: "",
  message: "",
  order_id: "",
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
      const response = await fetch("/api/support-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: [formData.first_name, formData.last_name].filter(Boolean).join(" ").trim(),
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          topic: formData.subject || "Website contact request",
          orderId: formData.order_id,
          message: formData.message,
          source: "customer_contact_page",
        }),
      });

      const data = (await response.json()) as SupportResponse;

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Unable to submit your message right now.");
        return;
      }

      setSuccess(`Message received. Reference ID: ${data.supportId ?? "support request created"}.`);
      setFormData(initialFormData);
    } catch {
      setError("Unexpected error while submitting your message.");
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
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={href === "/contact" ? "text-green-900 underline decoration-green-800 decoration-2 underline-offset-8" : "hover:text-green-800"}>{label}</Link>
            ))}
          </nav>
          <Link href="/quote" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Request Pricing</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(34,197,94,0.22),transparent_28%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block">
          <img src="/products/cattle-guard-hero.png" alt="Concrete cattle guard at a ranch entrance" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/65 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Contact Cattle Guard Forms</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Get help with quotes, orders, freight, and distributor support.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">Send project details, order questions, BOL or shipping notes, distributor questions, or support requests. The team will route your message to the right workflow.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">Start a Quote</Link>
            <a href={`mailto:${companyBusinessProfile.supportEmail}`} className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Email Support</a>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-6">
        <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:grid-cols-3">
          {supportCards.map((card) => (
            <div key={card.title} className="rounded-xl bg-green-50 p-5 ring-1 ring-green-100">
              <h2 className="font-black text-green-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-green-900">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Support information</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">We route your request to the right team.</h2>
            <p className="mt-4 leading-7 text-neutral-700">Use this form for order support, distributor questions, shipping and BOL updates, quote help, or general customer service. If you have an order number, include it so we can attach your message to the correct order.</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
            <h2 className="text-xl font-black text-neutral-950">Business Address</h2>
            <address className="mt-4 whitespace-pre-line leading-7 text-neutral-700 not-italic">{formatCompanyAddress()}</address>
            <a href={`mailto:${companyBusinessProfile.supportEmail}`} className="mt-5 inline-flex rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">{companyBusinessProfile.supportEmail}</a>
          </div>

          <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
            <h2 className="text-xl font-black text-green-950">Helpful links</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/refund-policy" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-900 ring-1 ring-green-100 hover:bg-green-100">Refund and Return Policy</Link>
              <Link href="/shipping-policy" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-900 ring-1 ring-green-100 hover:bg-green-100">Shipping Policy</Link>
              <Link href="/privacy-policy" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-900 ring-1 ring-green-100 hover:bg-green-100">Privacy Policy</Link>
              <Link href="/terms" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-900 ring-1 ring-green-100 hover:bg-green-100">Terms and Conditions</Link>
            </div>
          </div>
        </aside>

        <form className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl" onSubmit={handleSubmit}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Support request</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Send us a message</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">We will email a confirmation and route your message internally. For active orders, include the order ID, BOL, tracking, delivery, or quantity details in the message.</p>

          {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
          {success ? <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div> : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">Email *<input required name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">First name<input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First name" className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">Last name<input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last name" className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">Phone<input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">Company<input name="company" value={formData.company} onChange={handleChange} placeholder="Company" className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">Order ID, if applicable<input name="order_id" value={formData.order_id} onChange={handleChange} placeholder="Optional order ID" className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">Topic<input name="subject" value={formData.subject} onChange={handleChange} placeholder="Quote, order, freight, distributor, support..." className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">How can we help? *<textarea required name="message" value={formData.message} onChange={handleChange} placeholder="Tell us what you need help with." rows={7} className="rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-green-800 px-5 py-4 font-black text-white shadow-lg shadow-green-950/20 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Submitting..." : "Submit Support Request"}
          </button>
        </form>
      </section>
    </main>
  );
}
