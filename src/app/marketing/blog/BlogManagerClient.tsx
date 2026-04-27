"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type BlogRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  publish_date: string | null;
  seo_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  body: string | null;
  campaign: string | null;
  hero_image_prompt: string | null;
  supporting_image_prompts: string | null;
  video_pack: string | null;
  social_pack: string | null;
  email_pack: string | null;
};

type BlogApiResponse = {
  posts?: BlogRecord[];
  post?: BlogRecord;
  error?: string;
};

const emptyForm: BlogRecord = {
  id: "",
  title: "",
  slug: "",
  category: "Product education",
  status: "draft",
  publish_date: "",
  seo_title: "",
  meta_description: "",
  excerpt: "",
  body: "",
  campaign: "",
  hero_image_prompt: "",
  supporting_image_prompts: "",
  video_pack: "",
  social_pack: "",
  email_pack: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function toPayload(record: BlogRecord) {
  return {
    title: record.title,
    slug: record.slug || slugify(record.title),
    category: record.category,
    status: record.status,
    publish_date: record.publish_date || null,
    seo_title: record.seo_title || record.title,
    meta_description: record.meta_description || null,
    excerpt: record.excerpt || null,
    body: record.body || null,
    campaign: record.campaign || null,
    hero_image_prompt: record.hero_image_prompt || null,
    supporting_image_prompts: record.supporting_image_prompts || null,
    video_pack: record.video_pack || null,
    social_pack: record.social_pack || null,
    email_pack: record.email_pack || null,
  };
}

export default function BlogManagerClient() {
  const [records, setRecords] = useState<BlogRecord[]>([]);
  const [form, setForm] = useState<BlogRecord>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/marketing/blog-posts", { cache: "no-store" });
      const data = await readJson<BlogApiResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to load blog posts.");
      setRecords(data.posts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load blog posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  function updateField(field: keyof BlogRecord, value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && !editingId) {
        next.slug = slugify(value);
        next.seo_title = value;
      }
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Blog title is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/marketing/blog-posts/${editingId}` : "/api/marketing/blog-posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await readJson<BlogApiResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to save blog post.");
      setMessage(editingId ? "Blog post updated." : "Blog post saved as website draft.");
      setForm(emptyForm);
      setEditingId(null);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save blog post.");
    } finally {
      setSaving(false);
    }
  }

  function edit(record: BlogRecord) {
    setForm({ ...record, publish_date: record.publish_date ?? "" });
    setEditingId(record.id);
    setMessage("");
    setError("");
  }

  async function updateStatus(record: BlogRecord, status: "draft" | "published" | "archived") {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/marketing/blog-posts/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, publish_date: record.publish_date || new Date().toISOString().slice(0, 10) }),
      });
      const data = await readJson<BlogApiResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to update publish status.");
      setMessage(status === "published" ? "Blog post published to website." : `Blog post moved to ${status}.`);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update publish status.");
    }
  }

  async function remove(id: string) {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/marketing/blog-posts/${id}`, { method: "DELETE" });
      const data = await readJson<BlogApiResponse & { ok?: boolean }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to delete blog post.");
      setMessage("Blog post deleted.");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete blog post.");
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{editingId ? "Edit website blog post" : "Create website blog draft"}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Save drafts to Supabase and publish them directly to the public website blog.</p>
          </div>
          <button type="button" onClick={() => void loadPosts()} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-green-50">Refresh</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/marketing/ai" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Generate Blog with AI</Link>
          <Link href="/blog" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">View Public Blog</Link>
          <Link href="/marketing/marketing-content" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Marketing Content</Link>
        </div>

        {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}
        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input label="Blog title" value={form.title} onChange={(value) => updateField("title", value)} />
          <Input label="Slug" value={form.slug} onChange={(value) => updateField("slug", slugify(value))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Category" value={form.category} options={["Installation tips", "Cost savings", "Distributor education", "Product education", "Ranch operations", "FAQ", "SEO article"]} onChange={(value) => updateField("category", value)} />
            <Select label="Status" value={form.status} options={["draft", "review", "approved", "published", "archived"]} onChange={(value) => updateField("status", value)} />
          </div>
          <Input label="Publish date" type="date" value={form.publish_date ?? ""} onChange={(value) => updateField("publish_date", value)} />
          <Input label="SEO title" value={form.seo_title ?? ""} onChange={(value) => updateField("seo_title", value)} />
          <Input label="Meta description" value={form.meta_description ?? ""} onChange={(value) => updateField("meta_description", value)} />
          <Input label="Related campaign" value={form.campaign ?? ""} onChange={(value) => updateField("campaign", value)} />
          <Textarea label="Excerpt" value={form.excerpt ?? ""} onChange={(value) => updateField("excerpt", value)} />
          <Textarea label="Full blog body / AI package" value={form.body ?? ""} onChange={(value) => updateField("body", value)} />
          <Textarea label="Hero image prompt" value={form.hero_image_prompt ?? ""} onChange={(value) => updateField("hero_image_prompt", value)} />
          <Textarea label="Social repurpose pack" value={form.social_pack ?? ""} onChange={(value) => updateField("social_pack", value)} />
          <Textarea label="Email repurpose pack" value={form.email_pack ?? ""} onChange={(value) => updateField("email_pack", value)} />

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">{saving ? "Saving..." : editingId ? "Save Changes" : "Add to Website Draft"}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button> : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-xl font-semibold">Website blog posts</h2>
        <p className="mt-2 text-sm text-neutral-600">{loading ? "Loading..." : `${records.length} Supabase blog post${records.length === 1 ? "" : "s"}`}</p>
        <div className="mt-5 space-y-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-green-800">
                    <span>{record.category}</span>
                    <span>{record.status}</span>
                    {record.publish_date ? <span>{record.publish_date}</span> : null}
                  </div>
                  <h3 className="mt-2 font-semibold text-neutral-950">{record.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{record.excerpt || "No excerpt yet."}</p>
                  <p className="mt-2 text-xs text-neutral-500">/blog#{record.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(record)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-white">Edit</button>
                  {record.status === "published" ? (
                    <button type="button" onClick={() => void updateStatus(record, "draft")} className="rounded border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50">Unpublish</button>
                  ) : (
                    <button type="button" onClick={() => void updateStatus(record, "published")} className="rounded border border-green-700 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50">Publish</button>
                  )}
                  <button type="button" onClick={() => void remove(record.id)} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 rounded border border-neutral-300 px-3 py-2 font-normal" />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
