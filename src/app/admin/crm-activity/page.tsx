"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type ActivityRecord = {
  id: string;
  activityType: string;
  title: string;
  personCompany: string;
  source: string;
  status: string;
  lastActivity: string;
  notes: string;
};

type CrmPayload = {
  ok?: boolean;
  error?: string;
  summary?: {
    records: number;
    contacts: number;
    quotes: number;
    followUps: number;
    notes: number;
    open: number;
  };
  records?: ActivityRecord[];
  record?: ActivityRecord;
};

const defaultForm = {
  activityType: "note",
  title: "",
  personCompany: "",
  source: "manual",
  status: "open",
  lastActivity: new Date().toISOString().slice(0, 10),
  notes: "",
};

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "closed", "won"].includes(normalized)) return "bg-green-50 text-green-800 ring-green-200";
  if (["follow up", "open", "pending"].includes(normalized)) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (["blocked", "lost"].includes(normalized)) return "bg-red-50 text-red-800 ring-red-200";
  return "bg-neutral-50 text-neutral-700 ring-neutral-200";
}

export default function AdminCrmActivityPage() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [summary, setSummary] = useState<CrmPayload["summary"]>({ records: 0, contacts: 0, quotes: 0, followUps: 0, notes: 0, open: 0 });
  const [form, setForm] = useState(defaultForm);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function getAccessToken() {
    if (!supabase) throw new Error("Admin auth is not available right now.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return token;
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  async function loadRecords() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/crm-activity", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as CrmPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load CRM activity.");
      setRecords(payload.records ?? []);
      setSummary(payload.summary ?? { records: 0, contacts: 0, quotes: 0, followUps: 0, notes: 0, open: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load CRM activity.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkSessionAndLoad() {
      if (!supabase) {
        setError("Admin authentication is not available right now.");
        setSessionChecked(true);
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        setHasSession(false);
        setSessionChecked(true);
        setLoading(false);
        window.location.href = "/admin";
        return;
      }
      setHasSession(true);
      setSessionChecked(true);
      await loadRecords();
    }
    void checkSessionAndLoad();
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!form.title.trim()) {
      setError("Activity title is required.");
      return;
    }

    setSaving(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/crm-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as CrmPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to create CRM activity.");
      setMessage("CRM activity created in Supabase.");
      setForm(defaultForm);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create CRM activity.");
    } finally {
      setSaving(false);
    }
  }

  if (!sessionChecked || !hasSession) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Checking admin session</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Redirecting to admin login...</h1>
          {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/admin/crm-import" className="hover:text-green-800">CRM Import</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <button onClick={() => void handleSignOut()} className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Sign Out</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / CRM Activity</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">CRM Activity</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">Live CRM records from Supabase. Create notes, follow-ups, quote activity, customer contact records, and order-related activity.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => void loadRecords()} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Refresh CRM</button>
            <Link href="/marketing/lead-inbox" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Lead Inbox</Link>
            <Link href="/admin/crm-import" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">CRM Import</Link>
          </div>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {message ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-5">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Records</p><p className="mt-2 text-3xl font-bold">{summary?.records ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Contacts</p><p className="mt-2 text-3xl font-bold">{summary?.contacts ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Quote Requests</p><p className="mt-2 text-3xl font-bold">{summary?.quotes ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Follow-Ups</p><p className="mt-2 text-3xl font-bold">{summary?.followUps ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Open</p><p className="mt-2 text-3xl font-bold">{summary?.open ?? 0}</p></div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Create CRM Activity</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">New activity records are saved to Supabase and visible across browsers.</p>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Activity type
                <select value={form.activityType} onChange={(event) => setForm((current) => ({ ...current, activityType: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                  <option value="contact">contact</option><option value="quote request">quote request</option><option value="follow up">follow up</option><option value="note">note</option><option value="order activity">order activity</option><option value="abandoned checkout">abandoned checkout</option><option value="distributor update">distributor update</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Activity title
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Follow up with distributor" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Person / company
                <input value={form.personCompany} onChange={(event) => setForm((current) => ({ ...current, personCompany: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Customer, company, or distributor" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Source
                  <select value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                    <option value="manual">manual</option><option value="contact form">contact form</option><option value="quote">quote</option><option value="order">order</option><option value="distributor">distributor</option><option value="checkout">checkout</option><option value="historical import">historical import</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Status
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                    <option value="open">open</option><option value="pending">pending</option><option value="follow up">follow up</option><option value="completed">completed</option><option value="blocked">blocked</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Last activity date
                <input type="date" value={form.lastActivity} onChange={(event) => setForm((current) => ({ ...current, lastActivity: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Notes
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Activity details, follow-up notes, next steps" />
              </label>
              <button disabled={saving} type="submit" className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">{saving ? "Saving..." : "Create Activity"}</button>
            </form>
          </article>

          <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-6"><h2 className="text-xl font-semibold">Activity records</h2><p className="mt-2 text-sm text-neutral-600">{records.length} total activity record{records.length === 1 ? "" : "s"}</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Person / Company</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last Activity</th></tr></thead>
                <tbody>
                  {loading ? <tr className="border-t border-neutral-200"><td colSpan={5} className="px-4 py-8 text-center text-neutral-600">Loading CRM activity...</td></tr> : null}
                  {!loading && records.length === 0 ? <tr className="border-t border-neutral-200"><td colSpan={5} className="px-4 py-8 text-center text-neutral-600">No CRM activity found in Supabase.</td></tr> : null}
                  {!loading && records.map((row) => <tr key={row.id} className="border-t border-neutral-200 align-top"><td className="px-4 py-4"><span className="block font-medium">{row.title}</span><span className="mt-1 block text-xs text-neutral-500">{row.activityType}</span></td><td className="px-4 py-4">{row.personCompany || "Not set"}</td><td className="px-4 py-4">{row.source}</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(row.status)}`}>{row.status}</span></td><td className="px-4 py-4 text-neutral-600">{row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : "Pending"}</td></tr>)}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
