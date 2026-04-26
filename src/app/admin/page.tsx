"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const ADMIN_EMAIL = "support@cattleguardforms.com";
const ADMIN_SESSION_KEY = "cgf-admin-authenticated";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabaseAuth = Boolean(supabaseUrl && supabaseKey);

const metrics = [
  ["Total Distributors", "2", "Approved distributor accounts", "/admin/distributors"],
  ["Active Orders", "0", "Open retail and distributor orders", "/admin/orders"],
  ["Abandoned Checkouts", "0", "Started checkout but did not finish", "/admin/abandoned-checkouts"],
  ["Visits Today", "0", "Analytics wiring next", "/admin/analytics"],
  ["Visits This Month", "0", "Monthly site traffic", "/admin/analytics"],
  ["New CRM Leads", "0", "Contact and quote submissions", "/admin/crm-activity"],
];

const modules = [
  ["Manage Distributor Accounts", "/admin/distributors"],
  ["Orders", "/admin/orders"],
  ["Abandoned Checkouts", "/admin/abandoned-checkouts"],
  ["Site Analytics", "/admin/analytics"],
  ["CRM Activity", "/admin/crm-activity"],
  ["CRM Historical Import", "/admin/crm-import"],
  ["Settings", "/admin/settings"],
];

function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center">
          <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
          <Link href="/admin" className="text-green-800">Admin Portal</Link>
          <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          <Link href="/distributor" className="hover:text-green-800">Distributor Portal</Link>
          <Link href="/contact" className="hover:text-green-800">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export default function AdminPortalPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Temporary browser persistence so admin navigation does not force the setup login.
    // Replace with server-side Supabase session + app_profiles.role = admin checks before production.
    if (window.localStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      setSignedIn(true);
    }
    setSessionChecked(true);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== ADMIN_EMAIL) {
        setError(`Use ${ADMIN_EMAIL} for admin access.`);
        return;
      }

      if (hasSupabaseAuth && supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (signInError) {
          setError(`${signInError.message}. Create or reset ${ADMIN_EMAIL} in Supabase Auth.`);
          return;
        }
        window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
        setSignedIn(true);
        return;
      }

      window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
      setSignedIn(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setSignedIn(false);
    setPassword("");

    if (hasSupabaseAuth && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signOut();
    }
  }

  if (!sessionChecked) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <Header />
        <section className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Loading admin session</p>
        </section>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <Header />
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Protected admin access</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Portal Login</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
              Use {ADMIN_EMAIL} for admin access. Once Supabase is fully configured, this page will require the real Supabase password and admin role.
            </p>
            <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
              {hasSupabaseAuth ? `Supabase auth is active. Create or reset ${ADMIN_EMAIL} in Supabase Auth before logging in.` : "Supabase auth is not configured here, so this temporary setup gate will allow the support email without a password."}
            </div>
          </div>

          <form onSubmit={handleLogin} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Admin Sign In</h2>
            {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Admin email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder={ADMIN_EMAIL} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Password
                <input required={hasSupabaseAuth} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder={hasSupabaseAuth ? "Supabase password" : "Leave blank"} />
              </label>
              <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
                {loading ? "Signing in..." : "Log In to Admin Portal"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Business command center</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Portal</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">View distributors, active orders, abandoned checkouts, analytics, CRM activity, historical imports, and settings.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/marketing" className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Go to Marketing Portal</Link>
              <button onClick={handleSignOut} className="rounded border border-neutral-300 px-5 py-3 font-semibold">Sign Out</button>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value, note, href]) => (
            <Link key={label} href={href} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Admin Modules</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {modules.map(([title, href]) => (
              <Link key={title} href={href} className="rounded-xl border border-neutral-200 p-5 font-semibold hover:border-green-800 hover:bg-green-50">{title}</Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
