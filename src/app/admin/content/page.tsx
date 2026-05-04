"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type ContentBlock = {
  id?: string;
  page_key: string;
  section_key: string;
  label: string;
  content: string;
  content_type: string;
  updated_at?: string;
};

type ContentPayload = { ok?: boolean; error?: string; blocks?: ContentBlock[]; block?: ContentBlock };

const starterBlocks: ContentBlock[] = [
  { page_key: "home", section_key: "hero_eyebrow", label: "Home hero eyebrow", content_type: "text", content: "CowStop Reusable Concrete Cattle Guard Forms" },
  { page_key: "home", section_key: "hero_headline", label: "Home hero headline", content_type: "text", content: "Reusable Concrete Cattle Guard Forms for Ranch & Farm Entrances" },
  { page_key: "home", section_key: "hero_body", label: "Home hero body", content_type: "textarea", content: "CowStop helps ranchers, contractors, concrete companies, and landowners pour durable concrete cattle guards on site without relying on expensive fabricated steel grids." },
  { page_key: "quote", section_key: "hero_headline", label: "Quote page headline", content_type: "text", content: "Buy the reusable form. Pour strong cattle guards on-site." },
  { page_key: "quote", section_key: "hero_body", label: "Quote page body", content_type: "textarea", content: "Enter delivery details, select freight, and checkout securely." },
  { page_key: "faq", section_key: "meta_description", label: "FAQ meta description", content_type: "textarea", content: "Answers to common questions about CowStop reusable concrete cattle guard forms, freight, sizing, installation, and planning." },
];

export default function AdminContentPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedPage, setSelectedPage] = useState("all");
  const [editing, setEditing] = useState<ContentBlock>(starterBlocks[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function loadBlocks() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const query = selectedPage === "all" ? "" : `?page_key=${encodeURIComponent(selectedPage)}`;
      const response = await fetch(`/api/admin/site-content${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as ContentPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to load site content.");
      setBlocks(payload.blocks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load site content.");
    } finally {
      setLoading(false);
    }
  }

  async function saveBlock(block = editing) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/site-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(block),
      });
      const payload = (await response.json()) as ContentPayload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Unable to save site content.");
      setNotice(`${block.label || block.section_key} saved.`);
      await loadBlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save site content.");
    } finally {
      setSaving(false);
    }
  }

  async function seedStarterBlocks() {
    for (const block of starterBlocks) await saveBlock(block);
  }

  useEffect(() => { void loadBlocks(); }, [selectedPage, supabase]);

  const pages = Array.from(new Set([...starterBlocks.map((block) => block.page_key), ...blocks.map((block) => block.page_key)])).sort();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/pricing" className="hover:text-green-800">Pricing</Link>
            <Link href="/admin/seo" className="hover:text-green-800">SEO Audit</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Site Content</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Site Content Editor</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">Edit approved content blocks for live pages. Public pages keep safe fallback copy until each page is wired to these blocks.</p>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Content Blocks</h2>
              <div className="flex gap-2">
                <select value={selectedPage} onChange={(event) => setSelectedPage(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 text-sm">
                  <option value="all">All pages</option>
                  {pages.map((page) => <option key={page} value={page}>{page}</option>)}
                </select>
                <button onClick={() => void seedStarterBlocks()} disabled={saving} className="rounded bg-green-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Seed defaults</button>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {loading ? <p className="text-sm text-neutral-600">Loading content...</p> : null}
              {!loading && blocks.length === 0 ? <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">No content blocks yet. Click Seed defaults or create one on the right.</p> : null}
              {blocks.map((block) => (
                <button key={`${block.page_key}:${block.section_key}`} onClick={() => setEditing(block)} className="rounded-xl border border-neutral-200 p-4 text-left hover:border-green-800 hover:bg-green-50">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-800">{block.page_key} / {block.section_key}</p>
                  <p className="mt-1 font-bold">{block.label}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{block.content}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Edit Block</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Page key<input value={editing.page_key} onChange={(event) => setEditing((current) => ({ ...current, page_key: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="home" /></label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Section key<input value={editing.section_key} onChange={(event) => setEditing((current) => ({ ...current, section_key: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" placeholder="hero_headline" /></label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Label<input value={editing.label} onChange={(event) => setEditing((current) => ({ ...current, label: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Content type<select value={editing.content_type} onChange={(event) => setEditing((current) => ({ ...current, content_type: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal"><option value="text">Text</option><option value="textarea">Long text</option><option value="meta_title">SEO title</option><option value="meta_description">SEO description</option><option value="cta">CTA</option></select></label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Content<textarea value={editing.content} onChange={(event) => setEditing((current) => ({ ...current, content: event.target.value }))} rows={8} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
              <button onClick={() => void saveBlock()} disabled={saving} className="rounded bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900 disabled:opacity-50">{saving ? "Saving..." : "Save Content Block"}</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
