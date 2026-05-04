"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type SeoFinding = {
  id: string;
  page_url: string;
  finding_type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  status: string;
  created_at: string;
};

type SeoPayload = { ok?: boolean; error?: string; findings?: SeoFinding[] };

export default function AdminSeoPage() {
  const [findings, setFindings] = useState<SeoFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
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

  async function loadFindings() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/seo-audit", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as SeoPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load SEO findings.");
      setFindings(payload.findings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load SEO findings.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/seo-audit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await response.json()) as SeoPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to update SEO finding.");
      await loadFindings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update SEO finding.");
    } finally {
      setUpdatingId("");
    }
  }

  useEffect(() => { void loadFindings(); }, [supabase]);

  const openFindings = findings.filter((finding) => finding.status !== "resolved");

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin/content" className="hover:text-green-800">Site Content</Link>
            <Link href="/admin/pricing" className="hover:text-green-800">Pricing</Link>
            <button onClick={() => void loadFindings()} className="rounded border border-neutral-300 px-3 py-2 font-semibold hover:bg-neutral-50">Refresh</button>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / SEO Audit</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">SEO Audit & Recommendations</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">This dashboard stores crawler findings and recommendations. The crawler/bot can add missing meta, dead-link, placeholder, sandbox/test-wording, and thin-content findings for admin approval.</p>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Total Findings</p><p className="mt-2 text-3xl font-bold">{findings.length}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Open</p><p className="mt-2 text-3xl font-bold">{openFindings.length}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm text-neutral-500">Resolved</p><p className="mt-2 text-3xl font-bold">{findings.length - openFindings.length}</p></div>
        </div>

        <div className="mt-8 grid gap-4">
          {loading ? <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">Loading SEO findings...</div> : null}
          {!loading && findings.length === 0 ? <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><p className="font-bold">No SEO findings yet.</p><p className="mt-2 text-sm text-neutral-600">The storage/dashboard is ready. Next step is the crawler worker that scans live URLs and inserts findings here.</p></div> : null}
          {findings.map((finding) => (
            <article key={finding.id} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide"><span className="rounded-full bg-green-50 px-2 py-1 text-green-800">{finding.finding_type}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{finding.severity}</span><span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">{finding.status}</span></div>
                  <h2 className="mt-3 text-xl font-bold">{finding.title}</h2>
                  <p className="mt-2 text-sm font-semibold text-green-800">{finding.page_url}</p>
                  <p className="mt-3 leading-7 text-neutral-700">{finding.description}</p>
                  {finding.recommendation ? <p className="mt-3 rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-950"><strong>Recommendation:</strong> {finding.recommendation}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={updatingId === finding.id} onClick={() => void updateStatus(finding.id, "open")} className="rounded border border-neutral-300 px-3 py-2 text-sm font-bold hover:bg-neutral-50 disabled:opacity-50">Open</button>
                  <button disabled={updatingId === finding.id} onClick={() => void updateStatus(finding.id, "resolved")} className="rounded bg-green-800 px-3 py-2 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-50">Resolve</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
