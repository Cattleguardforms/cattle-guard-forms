"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ChannelAction = { label: string; href: string; primary?: boolean };
type SetupRow = { item: string; complete: boolean; notes: string };
type MetricRow = { metric: string; value: string; source: string; updatedAt: string };
type ConnectionState = { status: string; accountId: string; accountName: string; monthlyBudget: string; trackingUrl: string; notes: string; setupRows: SetupRow[]; metricRows: MetricRow[] };

type ChannelPageProps = {
  label: string;
  eyebrow: string;
  description: string;
  status: string;
  connectLabel: string;
  setupItems: string[];
  workflowItems: string[];
  metricItems: string[];
  actions?: ChannelAction[];
};

function storageKey(label: string) {
  return `cgf-campaign-channel-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function providerUrl(label: string) {
  const key = label.toLowerCase();
  if (key.includes("google")) return "https://ads.google.com/";
  if (key.includes("facebook") || key.includes("marketplace")) return "https://business.facebook.com/";
  if (key.includes("tiktok")) return "https://ads.tiktok.com/";
  if (key.includes("linkedin")) return "https://www.linkedin.com/campaignmanager/";
  return "/marketing/campaigns";
}

function defaultState(status: string, setupItems: string[], metricItems: string[]): ConnectionState {
  return {
    status,
    accountId: "",
    accountName: "",
    monthlyBudget: "",
    trackingUrl: "",
    notes: "",
    setupRows: setupItems.map((item) => ({ item, complete: false, notes: "" })),
    metricRows: metricItems.map((metric) => ({ metric, value: "", source: "Manual / not connected", updatedAt: "" })),
  };
}

export default function CampaignChannelPage({ label, eyebrow, description, status, connectLabel, setupItems, workflowItems, metricItems, actions = [] }: ChannelPageProps) {
  const key = useMemo(() => storageKey(label), [label]);
  const [state, setState] = useState<ConnectionState>(() => defaultState(status, setupItems, metricItems));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ConnectionState;
      setState({ ...defaultState(status, setupItems, metricItems), ...parsed });
    } catch {
      setState(defaultState(status, setupItems, metricItems));
    }
  }, [key, metricItems, setupItems, status]);

  function save(next = state) {
    window.localStorage.setItem(key, JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function update(partial: Partial<ConnectionState>) {
    const next = { ...state, ...partial };
    setState(next);
  }

  function updateSetup(index: number, partial: Partial<SetupRow>) {
    const setupRows = state.setupRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...partial } : row);
    update({ setupRows });
  }

  function updateMetric(index: number, partial: Partial<MetricRow>) {
    const metricRows = state.metricRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...partial, updatedAt: new Date().toLocaleDateString() } : row);
    update({ metricRows });
  }

  const completed = state.setupRows.filter((row) => row.complete).length;
  const connected = state.status === "Connected" || Boolean(state.accountId || state.accountName);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing/campaigns" className="text-sm font-semibold text-green-800 hover:text-green-950">Back to Campaigns</Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <Link href="/marketing/sales-analytics" className="hover:text-green-800">Sales Analytics</Link>
            <Link href="/marketing/contacts" className="hover:text-green-800">CRM Contacts</Link>
            <Link href="/marketing/seo" className="hover:text-green-800">SEO Tester</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">{eyebrow}</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{label}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">{description}</p>
            </div>
            <div className="rounded-xl bg-green-50 px-5 py-4 text-green-950 ring-1 ring-green-200">
              <p className="text-sm font-medium">Status</p>
              <p className="mt-1 text-2xl font-bold">{connected ? "Connected" : state.status}</p>
              <p className="mt-1 text-xs text-green-900">Checklist: {completed}/{state.setupRows.length}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-bold">Connection</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{connectLabel}</p>
            <div className="mt-5 grid gap-3">
              <a href={providerUrl(label)} target="_blank" rel="noreferrer" className="rounded bg-green-800 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-900">Open {label} Account</a>
              {actions.filter((action) => !action.label.toLowerCase().includes("connect")).map((action) => (
                <Link key={action.label} href={action.href} className="rounded border border-neutral-300 px-4 py-3 text-center text-sm font-bold hover:bg-neutral-50">{action.label}</Link>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              <Field label="Account ID / handle" value={state.accountId} onChange={(value) => update({ accountId: value, status: value ? "Connected" : state.status })} />
              <Field label="Account name" value={state.accountName} onChange={(value) => update({ accountName: value, status: value ? "Connected" : state.status })} />
              <Field label="Monthly budget" value={state.monthlyBudget} onChange={(value) => update({ monthlyBudget: value })} />
              <Field label="Tracking URL / UTM template" value={state.trackingUrl} onChange={(value) => update({ trackingUrl: value })} />
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Notes<textarea value={state.notes} onChange={(event) => update({ notes: event.target.value })} className="min-h-24 rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
              <button type="button" onClick={() => save()} className="rounded bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900">Save Connection</button>
              {saved ? <p className="text-sm font-semibold text-green-800">Saved.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-bold">Live Setup Checklist</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-3 py-3">Done</th><th className="px-3 py-3">Task</th><th className="px-3 py-3">Notes</th></tr></thead>
                <tbody>{state.setupRows.map((row, index) => <tr key={row.item} className="border-t border-neutral-200"><td className="px-3 py-3"><input type="checkbox" checked={row.complete} onChange={(event) => updateSetup(index, { complete: event.target.checked })} /></td><td className="px-3 py-3 font-semibold">{row.item}</td><td className="px-3 py-3"><input value={row.notes} onChange={(event) => updateSetup(index, { notes: event.target.value })} className="w-full rounded border border-neutral-300 px-2 py-1" placeholder="Add note..." /></td></tr>)}</tbody>
              </table>
            </div>
            <button type="button" onClick={() => save()} className="mt-4 rounded border border-green-800 bg-white px-4 py-2 text-sm font-bold text-green-900 hover:bg-green-50">Save Checklist</button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-bold">Live Metrics Table</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">Use this table now for manual/imported metrics. The next backend step is provider API/OAuth or CSV imports so these populate automatically.</p>
          <div className="mt-5 overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-3 py-3">Metric</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Updated</th></tr></thead>
              <tbody>{state.metricRows.map((row, index) => <tr key={row.metric} className="border-t border-neutral-200"><td className="px-3 py-3 font-semibold">{row.metric}</td><td className="px-3 py-3"><input value={row.value} onChange={(event) => updateMetric(index, { value: event.target.value })} className="w-full rounded border border-neutral-300 px-2 py-1" placeholder="0" /></td><td className="px-3 py-3"><input value={row.source} onChange={(event) => updateMetric(index, { source: event.target.value })} className="w-full rounded border border-neutral-300 px-2 py-1" /></td><td className="px-3 py-3">{row.updatedAt || "-"}</td></tr>)}</tbody>
            </table>
          </div>
          <button type="button" onClick={() => save()} className="mt-4 rounded bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900">Save Metrics</button>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-bold">Workflow</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowItems.map((item, index) => (
              <div key={item} className="rounded-xl border border-neutral-200 p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">{index + 1}</span><p className="mt-4 text-sm leading-6 text-neutral-700">{item}</p></div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-bold text-neutral-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>;
}
