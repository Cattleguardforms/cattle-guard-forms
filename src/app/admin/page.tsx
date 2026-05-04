"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabaseAuth = Boolean(supabaseUrl && supabaseKey);

type SummaryItem = { label: string; count: number };
type SummaryResponse = { ok?: boolean; error?: string; summary?: SummaryItem[] };

const portalLinks = [
  ["Portal Access", "/portals"],
  ["Admin Portal", "/admin"],
  ["Distributor Portal", "/distributor"],
  ["Manufacturer Portal", "/manufacturer"],
  ["Marketing Portal", "/marketing"],
  ["Public Blog", "/blog"],
  ["Public Site", "/"],
];

const modules = [
  ["Site Health", "/admin/live-readiness"],
  ["Orders", "/admin/orders"],
  ["Ship / Execute", "/admin/shipping-execution"],
  ["BOL Retry Queue", "/admin/bol-retry"],
  ["Customer Pricing", "/admin/pricing"],
  ["Site Content", "/admin/content"],
  ["SEO Audit", "/admin/seo"],
  ["Manage Distributor Accounts", "/admin/distributors"],
  ["Distributor Portal", "/distributor"],
  ["Manufacturer Portal", "/manufacturer"],
  ["Marketing Portal", "/marketing"],
  ["Public Site", "/"],
  ["Abandoned Checkouts", "/admin/abandoned-checkouts"],
  ["Site Analytics", "/admin/analytics"],
  ["CRM Activity", "/admin/crm-activity"],
  ["CRM Historical Import", "/admin/crm-import"],
  ["Settings", "/admin/settings"],
];

function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="inline-flex shrink-0 items-center">
          <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-medium text-neutral-700">
          {portalLinks.map(([label, href]) => <Link key={label} href={href} className={label === "Admin Portal" ? "text-green-800" : "hover:text-green-800"}>{label}</Link>)}
        </nav>
      </div>
    </header>
  );
}

export default function AdminPortalPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryItem[]>([]);

  const supabase = useMemo(() => {
    if (!hasSupabaseAuth || !supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function loadSummary() {
    if (!supabase) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setSummaryError("Admin session expired. Please sign in again."); setSignedIn(false); return; }
      const response = await fetch("/api/admin/summary", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as SummaryResponse;
      if (!response.ok || !payload.ok) { setSummaryError(payload.error ?? "Unable to load admin summary."); return; }
      setSummary(payload.summary ?? []);
    } catch {
      setSummaryError("Unable to load admin summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    async function checkSession() {
      if (!supabase) { setSessionChecked(true); return; }
      const { data } = await supabase.auth.getSession();
      setSignedIn(Boolean(data.session));
      setSessionChecked(true);
    }
    void checkSession();
  }, [supabase]);

  useEffect(() => { if (signedIn) void loadSummary(); }, [signedIn]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) { setError("Admin email is required."); return; }
      if (!supabase) { setError("Admin authentication is not available in this environment."); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: secret });
      if (signInError) { setError("Invalid admin credentials."); return; }
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setError("Admin session could not be created."); return; }
      const response = await fetch("/api/admin/summary", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as SummaryResponse;
      if (!response.ok || !payload.ok) { await supabase.auth.signOut(); setError("Authorized admin role is required."); return; }
      setSummary(payload.summary ?? []);
      setSignedIn(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setSignedIn(false);
    setSecret("");
    setSummary([]);
    if (supabase) await supabase.auth.signOut();
  }

  if (!sessionChecked) return <main className="min-h-screen bg-neutral-50 text-neutral-950"><Header /><section className="mx-auto max-w-7xl px-6 py-16"><p className="text-sm font-semibold uppercase tracking-wide text-green-800">Loading secure admin session</p></section></main>;

  if (!signedIn) return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950"><Header /><section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="text-sm font-semibold uppercase tracking-wide text-green-800">Protected admin access</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Portal Login</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">This area is restricted to authorized Cattle Guard Forms administrators.</p><div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">Sign in with an approved admin account to view orders, CRM activity, distributor records, marketing tools, and business operations.</div></div><form onSubmit={handleLogin} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"><h2 className="text-2xl font-semibold">Admin Sign In</h2>{error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}<div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-medium text-neutral-700">Admin email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="admin@example.com" /></label><label className="grid gap-2 text-sm font-medium text-neutral-700">Password<input required type="password" value={secret} onChange={(event) => setSecret(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="Password" /></label><button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">{loading ? "Signing in..." : "Log In to Admin Portal"}</button></div></form></section></main>
  );

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950"><Header /><section className="mx-auto max-w-7xl px-6 py-12"><div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-green-800">Business command center</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Portal</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">View distributors, fulfillment, active orders, abandoned checkouts, analytics, CRM activity, content, SEO, pricing, and settings.</p></div><div className="flex flex-wrap gap-3"><button onClick={loadSummary} disabled={summaryLoading} className="rounded border border-green-800 px-5 py-3 font-semibold text-green-900 hover:bg-green-50 disabled:opacity-60">Refresh Summary</button><Link href="/admin/orders" className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Orders</Link><button onClick={handleSignOut} className="rounded border border-neutral-300 px-5 py-3 font-semibold">Sign Out</button></div></div></div>{summaryError ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{summaryError}</div> : null}<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(summary.length ? summary : [{ label: "Summary", count: 0 }]).map((item) => <div key={item.label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-medium text-neutral-500">{item.label}</p><p className="mt-2 text-3xl font-bold">{summaryLoading ? "..." : item.count}</p></div>)}</section><section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-2xl font-semibold">Admin Modules</h2><div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{modules.map(([title, href]) => <Link key={title} href={href} className="rounded-xl border border-neutral-200 p-5 font-semibold hover:border-green-800 hover:bg-green-50">{title}</Link>)}</div></section></section></main>
  );
}
