"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type ProfileResponse = {
  ok?: boolean;
  error?: string;
  profile?: {
    email: string;
    companyName?: string;
    pricePerUnit?: number;
  };
};

export default function DistributorPortalAuthPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function verifyAccess() {
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setSignedIn(false);
      return;
    }

    const response = await fetch("/api/distributor/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as ProfileResponse;

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Approved distributor access is required.");
      await supabase.auth.signOut();
      setSignedIn(false);
      return;
    }

    setEmail(payload.profile?.email ?? "");
    setCompanyName(payload.profile?.companyName ?? "Approved Distributor");
    setPricePerUnit(payload.profile?.pricePerUnit ?? 750);
    setSignedIn(true);
  }

  useEffect(() => {
    async function init() {
      if (supabase) await verifyAccess();
      setReady(true);
    }

    void init();
  }, [supabase]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        setError("Distributor sign-in is not available right now.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError("Invalid distributor credentials.");
        return;
      }

      setPassword("");
      await verifyAccess();
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setSignedIn(false);
    setCompanyName("");
    setPricePerUnit(null);
    if (supabase) await supabase.auth.signOut();
  }

  if (!ready) {
    return <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-950">Loading distributor portal...</main>;
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <section className="mx-auto max-w-xl px-6 py-16">
          <Link href="/distributor" className="text-sm font-semibold text-green-800 hover:text-green-900">Back to distributor access</Link>
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Approved distributor portal</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Distributor Sign In</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">Sign in with an approved distributor account.</p>

            {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

            <form onSubmit={handleLogin} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">Password
                <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-green-800 hover:text-green-900">Back to public site</Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-800">Distributor portal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Welcome, {companyName}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
              Your distributor account is active. Live ordering tools can now be connected behind this approved distributor gate.
            </p>
          </div>
          <button onClick={handleSignOut} className="rounded border border-neutral-300 bg-white px-5 py-3 font-semibold hover:bg-neutral-50">Sign Out</button>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm text-neutral-500">Distributor price</p>
            <p className="mt-2 text-3xl font-bold">${pricePerUnit ?? 750}</p>
            <p className="mt-2 text-sm text-neutral-600">Per CowStop form.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Order support</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">Request help with quantity, payment, or account setup.</p>
            <Link href="/contact?topic=Distributor%20Order%20Support" className="mt-4 inline-flex font-semibold text-green-800 hover:text-green-900">Contact order support</Link>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Freight review</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">Coordinate freight details, BOLs, and delivery questions.</p>
            <Link href="/contact?topic=Distributor%20Freight%20Review" className="mt-4 inline-flex font-semibold text-green-800 hover:text-green-900">Request freight review</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
