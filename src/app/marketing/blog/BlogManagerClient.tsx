"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type BlogRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  publishDate: string;
  seoTitle: string;
  excerpt: string;
  draft: string;
  campaign: string;
};

const storageKey = "cgf-marketing-blog-manager";

const emptyForm: BlogRecord = {
  id: "",
  title: "",
  slug: "",
  category: "Installation tips",
  status: "idea",
  publishDate: "",
  seoTitle: "",
  excerpt: "",
  draft: "",
  campaign: "",
};

const starterPosts: BlogRecord[] = [
  {
    id: "steel-freight-savings",
    title: "How Reusable Concrete Cattle Guard Forms Help Ranchers Save on Steel Freight",
    slug: "reusable-concrete-cattle-guard-forms-save-on-steel-freight",
    category: "Cost savings",
    status: "published",
    publishDate: "2026-04-26",
    seoTitle: "Reusable Concrete Cattle Guard Forms vs Steel Freight Costs",
    excerpt: "Traditional steel cattle guards are expensive to fabricate, heavy to ship, and often slow to source. CowStop gives landowners a reusable form system for pouring durable concrete cattle guard sections on-site.",
    draft: "Draft article connected to the public blog page. Expand with freight comparison, concrete/rebar sourcing, reusable mold benefits, and CTA to request pricing.",
    campaign: "CowStop education",
  },
  {
    id: "pour-planning",
    title: "CowStop Pour Planning: How Many Sections You Need for 12, 16, and 18 Foot Openings",
    slug: "cowstop-pour-planning-12-16-18-foot-openings",
    category: "Installation planning",
    status: "published",
    publishDate: "2026-04-26",
    seoTitle: "CowStop Pour Planning for 12, 16, and 18 Foot Openings",
    excerpt: "A practical guide to opening size, pour count, layout planning, and when to consider CowStop sections, custom dividers, or Texan forms.",
    draft: "Draft article connected to the public blog page. Include 12 ft = 6 CowStop pours, 18 ft = 9 CowStop pours, and 16 ft alternatives.",
    campaign: "Installation education",
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function BlogManagerClient() {
  const [records, setRecords] = useState<BlogRecord[]>(starterPosts);
  const [form, setForm] = useState<BlogRecord>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      setRecords(JSON.parse(saved) as BlogRecord[]);
    } catch {
      setRecords(starterPosts);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  function updateField(field: keyof BlogRecord, value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && !editingId) {
        next.slug = slugify(value);
        next.seoTitle = value;
      }
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setMessage("Blog title is required.");
      return;
    }

    const record = {
      ...form,
      id: editingId ?? `${Date.now()}`,
      slug: form.slug || slugify(form.title),
    };

    if (editingId) {
      setRecords((current) => current.map((item) => (item.id === editingId ? record : item)));
      setMessage("Blog record updated.");
    } else {
      setRecords((current) => [record, ...current]);
      setMessage("Blog record created.");
    }

    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(record: BlogRecord) {
    setForm(record);
    setEditingId(record.id);
    setMessage("");
  }

  function remove(id: string) {
    setRecords((current) => current.filter((record) => record.id !== id));
    setMessage("Blog record deleted.");
  }

  function reset() {
    setRecords(starterPosts);
    setForm(emptyForm);
    setEditingId(null);
    setMessage("Starter blog records restored.");
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{editingId ? "Edit blog post" : "Create blog post"}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Plan public blog content, SEO titles, drafts, campaigns, and publishing status.</p>
          </div>
          <button type="button" onClick={reset} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-green-50">Reset starters</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/marketing/ai" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Generate Blog with AI</Link>
          <Link href="/blog" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">View Public Blog</Link>
          <Link href="/marketing/marketing-content" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Marketing Content</Link>
        </div>

        {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input label="Blog title" value={form.title} onChange={(value) => updateField("title", value)} />
          <Input label="Slug" value={form.slug} onChange={(value) => updateField("slug", slugify(value))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Category" value={form.category} options={["Installation tips", "Cost savings", "Distributor education", "Product education", "Ranch operations", "FAQ"]} onChange={(value) => updateField("category", value)} />
            <Select label="Status" value={form.status} options={["idea", "draft", "review", "approved", "published", "archived"]} onChange={(value) => updateField("status", value)} />
          </div>
          <Input label="Publish date" type="date" value={form.publishDate} onChange={(value) => updateField("publishDate", value)} />
          <Input label="SEO title" value={form.seoTitle} onChange={(value) => updateField("seoTitle", value)} />
          <Input label="Related campaign" value={form.campaign} onChange={(value) => updateField("campaign", value)} />
          <Textarea label="Excerpt" value={form.excerpt} onChange={(value) => updateField("excerpt", value)} />
          <Textarea label="Draft / notes" value={form.draft} onChange={(value) => updateField("draft", value)} />

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">{editingId ? "Save Changes" : "Save Blog Post"}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button> : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-xl font-semibold">Blog records</h2>
        <p className="mt-2 text-sm text-neutral-600">{records.length} saved blog record{records.length === 1 ? "" : "s"}</p>
        <div className="mt-5 space-y-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-green-800">
                    <span>{record.category}</span>
                    <span>{record.status}</span>
                    {record.publishDate ? <span>{record.publishDate}</span> : null}
                  </div>
                  <h3 className="mt-2 font-semibold text-neutral-950">{record.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{record.excerpt || "No excerpt yet."}</p>
                  <p className="mt-2 text-xs text-neutral-500">/{record.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => edit(record)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-white">Edit</button>
                  <button type="button" onClick={() => remove(record.id)} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
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
