"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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

const STORAGE_KEY = "cgf-admin-crm-activity";

const defaultForm = {
  activityType: "note",
  title: "",
  personCompany: "",
  source: "manual",
  status: "open",
  lastActivity: new Date().toISOString().slice(0, 10),
  notes: "",
};

const initialRecords: ActivityRecord[] = [];

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "closed", "won"].includes(normalized)) return "bg-green-50 text-green-800 ring-green-200";
  if (["follow up", "open", "pending"].includes(normalized)) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (["blocked", "lost"].includes(normalized)) return "bg-red-50 text-red-800 ring-red-200";
  return "bg-neutral-50 text-neutral-700 ring-neutral-200";
}

export default function AdminCrmActivityPage() {
  const [records, setRecords] = useState<ActivityRecord[]>(initialRecords);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      setRecords(JSON.parse(saved) as ActivityRecord[]);
    } catch {
      setRecords(initialRecords);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const counts = useMemo(() => {
    return {
      contacts: records.filter((record) => record.activityType === "contact").length,
      quotes: records.filter((record) => record.activityType === "quote request").length,
      followUps: records.filter((record) => record.activityType === "follow up").length,
      notes: records.filter((record) => record.activityType === "note").length,
    };
  }, [records]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage("Activity title is required.");
      return;
    }

    if (editingId) {
      setRecords((current) => current.map((record) => (record.id === editingId ? { ...record, ...form } : record)));
      setMessage("CRM activity updated.");
    } else {
      setRecords((current) => [{ id: `${Date.now()}`, ...form }, ...current]);
      setMessage("CRM activity created.");
    }

    setEditingId(null);
    setForm(defaultForm);
  }

  function edit(record: ActivityRecord) {
    setEditingId(record.id);
    setMessage(null);
    setForm({
      activityType: record.activityType,
      title: record.title,
      personCompany: record.personCompany,
      source: record.source,
      status: record.status,
      lastActivity: record.lastActivity,
      notes: record.notes,
    });
  }

  function remove(recordId: string) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    if (editingId === recordId) {
      setEditingId(null);
      setForm(defaultForm);
    }
    setMessage("CRM activity deleted.");
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/crm-import" className="hover:text-green-800">CRM Import</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / CRM Activity</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">CRM Activity</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Track contacts, quote requests, contact form submissions, order activity, abandoned checkout activity, distributor updates, notes, and follow-up tasks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/marketing/lead-inbox" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Lead Inbox</Link>
            <Link href="/admin/crm-import" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">CRM Import</Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">New Contacts</p><p className="mt-2 text-3xl font-bold">{counts.contacts}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Quote Requests</p><p className="mt-2 text-3xl font-bold">{counts.quotes}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Follow-Ups</p><p className="mt-2 text-3xl font-bold">{counts.followUps}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Notes</p><p className="mt-2 text-3xl font-bold">{counts.notes}</p></div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">{editingId ? "Edit CRM Activity" : "Create CRM Activity"}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Create manual CRM activity now. Records persist in this browser until Supabase-backed CRM activity is connected.</p>
            {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}

            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Activity type
                <select value={form.activityType} onChange={(event) => setForm((current) => ({ ...current, activityType: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                  <option value="contact">contact</option>
                  <option value="quote request">quote request</option>
                  <option value="follow up">follow up</option>
                  <option value="note">note</option>
                  <option value="order activity">order activity</option>
                  <option value="abandoned checkout">abandoned checkout</option>
                  <option value="distributor update">distributor update</option>
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
                    <option value="manual">manual</option>
                    <option value="contact form">contact form</option>
                    <option value="quote">quote</option>
                    <option value="order">order</option>
                    <option value="distributor">distributor</option>
                    <option value="checkout">checkout</option>
                    <option value="historical import">historical import</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-neutral-700">Status
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                    <option value="open">open</option>
                    <option value="pending">pending</option>
                    <option value="follow up">follow up</option>
                    <option value="completed">completed</option>
                    <option value="blocked">blocked</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Last activity date
                <input type="date" value={form.lastActivity} onChange={(event) => setForm((current) => ({ ...current, lastActivity: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Notes
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Activity details, follow-up notes, next steps" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">{editingId ? "Save Changes" : "Create Activity"}</button>
                {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(defaultForm); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button> : null}
              </div>
            </form>
          </article>

          <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-6">
              <h2 className="text-xl font-semibold">Activity records</h2>
              <p className="mt-2 text-sm text-neutral-600">{records.length} total activity record{records.length === 1 ? "" : "s"}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-600">
                  <tr><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Person / Company</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last Activity</th><th className="px-4 py-3">Actions</th></tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr className="border-t border-neutral-200"><td className="px-4 py-4 font-medium">No CRM activity yet</td><td className="px-4 py-4">Create the first record</td><td className="px-4 py-4">Manual, import, contact, order</td><td className="px-4 py-4">Ready</td><td className="px-4 py-4 text-neutral-600">Pending</td><td className="px-4 py-4">-</td></tr>
                  ) : null}
                  {records.map((row) => (
                    <tr key={row.id} className="border-t border-neutral-200 align-top">
                      <td className="px-4 py-4"><span className="block font-medium">{row.title}</span><span className="mt-1 block text-xs text-neutral-500">{row.activityType}</span></td>
                      <td className="px-4 py-4">{row.personCompany || "Not set"}</td>
                      <td className="px-4 py-4">{row.source}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(row.status)}`}>{row.status}</span></td>
                      <td className="px-4 py-4 text-neutral-600">{row.lastActivity || "Pending"}</td>
                      <td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => edit(row)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-green-50">Edit</button><button type="button" onClick={() => remove(row.id)} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
