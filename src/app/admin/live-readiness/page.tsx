"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type Check = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type ReadinessPayload = {
  ok?: boolean;
  error?: string;
  score?: number;
  totals?: { pass: number; warn: number; fail: number; total: number };
  checks?: Check[];
  checked_at?: string;
};

function badge(status: Check["status"]) {
  if (status === "pass") return "bg-green-50 text-green-800 ring-green-200";
  if (status === "warn") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-red-50 text-red-800 ring-red-200";
}

export default function AdminLiveReadinessPage() {
  const [payload, setPayload] = useState<ReadinessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function token() {
    if (!supabase) throw new Error("Admin auth is not available.");
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("Admin session not found. Sign in again from the admin portal.");
    return accessToken;
  }

  async function runChecks() {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/live-readiness", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = (await response.json()) as ReadinessPayload;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to run site health checks.");
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run site health checks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void runChecks(); }, [supabase]);

  const checks = payload?.checks ?? [];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin/orders" className="hover:text-green-800">Orders</Link>
            <Link href="/admin/bol-retry" className="hover:text-green-800">BOL Retry</Link>
            <Link href="/admin/analytics" className="hover:text-green-800">Analytics</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-bold uppercase tracking-wide text-green-800">Admin / Production Hardening</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Site Health</h1>
          <p className="mt-4 max-w-4xl leading-7 text-neutral-700">
            One place to check production-critical configuration, database access, pricing, fake/test cleanup, live paid orders, and BOL risk before relying on the site for live orders.
          </p>
          <button onClick={() => void runChecks()} disabled={loading} className="mt-6 rounded bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900 disabled:opacity-60">{loading ? "Running checks..." : "Run Site Health Checks"}</button>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Site Health Score</p><p className="mt-2 text-3xl font-black">{payload?.score ?? "-"}%</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Pass</p><p className="mt-2 text-3xl font-black text-green-800">{payload?.totals?.pass ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Warnings</p><p className="mt-2 text-3xl font-black text-amber-700">{payload?.totals?.warn ?? 0}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Failures</p><p className="mt-2 text-3xl font-black text-red-700">{payload?.totals?.fail ?? 0}</p></div>
        </div>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Site Health Checks</h2>
              {payload?.checked_at ? <p className="mt-1 text-sm text-neutral-500">Last checked: {new Date(payload.checked_at).toLocaleString()}</p> : null}
            </div>
          </div>

          {loading ? <p className="mt-5 text-sm text-neutral-600">Running checks...</p> : null}
          {!loading && checks.length === 0 ? <p className="mt-5 text-sm text-neutral-600">No checks returned.</p> : null}
          <div className="mt-5 grid gap-3">
            {checks.map((check) => (
              <article key={check.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-black">{check.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-700">{check.detail}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${badge(check.status)}`}>{check.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
