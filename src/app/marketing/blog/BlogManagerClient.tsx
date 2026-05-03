"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { blogImageLibrary, defaultBlogImages, serializeBlogImageSelections, parseBlogImageSelections, type BlogImageSelection } from "@/lib/marketing/blog-image-library";

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

type BlogApiResponse = { posts?: BlogRecord[]; post?: BlogRecord; error?: string };

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
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function toPayload(record: BlogRecord, images: BlogImageSelection[], statusOverride?: string) {
  const status = statusOverride || record.status || "draft";
  return {
    title: record.title,
    slug: record.slug || slugify(record.title),
    category: record.category,
    status,
    publish_date: record.publish_date || (status === "published" ? new Date().toISOString().slice(0, 10) : null),
    seo_title: record.seo_title || record.title,
    meta_description: record.meta_description || null,
    excerpt: record.excerpt || null,
    body: record.body || null,
    campaign: record.campaign || null,
    hero_image_prompt: serializeBlogImageSelections(images),
    supporting_image_prompts: serializeBlogImageSelections(images.filter((image) => image.role !== "featured")),
    video_pack: record.video_pack || null,
    social_pack: record.social_pack || null,
    email_pack: record.email_pack || null,
  };
}

function makeDraft(topic: string) {
  const subject = topic.trim() || "concrete cattle guard forms";
  const title = subject.length > 18 ? subject : `How to Plan ${subject}`;
  return {
    title,
    slug: slugify(title),
    seoTitle: `${title} | Cattle Guard Forms`,
    meta: `Learn practical planning tips for ${subject}, including installation, cost, freight, and product considerations.`,
    excerpt: `A practical guide to ${subject} for ranchers, distributors, and property owners planning cattle guard installations.`,
    body: [
      `# ${title}`,
      "",
      `This article explains ${subject} in clear terms for customers comparing cattle guard options, planning an installation, or deciding whether reusable concrete forms make sense for their property.`,
      "",
      "## Why this matters",
      "Steel cattle guards can be expensive to source and ship. Concrete cattle guard forms give customers another way to plan durable access while reducing dependency on heavy freight and custom fabrication.",
      "",
      "## What to consider",
      "- Opening width and section count",
      "- Drainage and base preparation",
      "- Concrete and reinforcement planning",
      "- Delivery timing and access for equipment",
      "- Distributor support and warranty paperwork",
      "",
      "## Next step",
      "Contact Cattle Guard Forms for help with pricing, quantity, and installation planning.",
    ].join("\n"),
  };
}

export default function BlogManagerClient() {
  const [records, setRecords] = useState<BlogRecord[]>([]);
  const [form, setForm] = useState<BlogRecord>(emptyForm);
  const [images, setImages] = useState<BlogImageSelection[]>(defaultBlogImages());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [refineNote, setRefineNote] = useState("");
  const [removeText, setRemoveText] = useState("");

  const featuredImage = useMemo(() => images.find((image) => image.role === "featured") || images[0], [images]);
  const bodyImages = useMemo(() => images.filter((image) => image.id !== featuredImage?.id), [images, featuredImage]);

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

  useEffect(() => { void loadPosts(); }, []);

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

  function generateDraft() {
    const draft = makeDraft(aiTopic);
    setForm((current) => ({ ...current, title: draft.title, slug: draft.slug, seo_title: draft.seoTitle, meta_description: draft.meta, excerpt: draft.excerpt, body: draft.body, status: "draft" }));
    setImages(defaultBlogImages());
    setMessage("Draft generated inside AI Blog Management. Refine wording, keep/change pictures, then save or publish.");
  }

  function refineWording(kind: "tighten" | "expand" | "add" | "remove") {
    setForm((current) => {
      let body = current.body || "";
      if (kind === "tighten") body = body.replace(/\n{3,}/g, "\n\n").replace(/\s+/g, " ").replace(/ #/g, "\n#").replace(/ ##/g, "\n\n##");
      if (kind === "expand") body = `${body}\n\n## Additional customer note\n${refineNote || "Add a clear example, installation tip, or cost-saving detail here."}`;
      if (kind === "add") body = `${body}\n\n${refineNote || "Add the requested detail here."}`;
      if (kind === "remove" && removeText.trim()) body = body.split(removeText).join("");
      return { ...current, body };
    });
    setMessage("Blog wording updated. Review the preview before publishing.");
  }

  function addLibraryImage(id: string) {
    const item = blogImageLibrary.find((image) => image.id === id);
    if (!item) return;
    setImages((current) => current.some((image) => image.id === item.id) ? current : [...current, { ...item, role: current.length === 0 ? "featured" : "body", placement: current.length === 0 ? "hero" : "middle" }]);
  }

  function updateImage(index: number, field: keyof BlogImageSelection, value: string) {
    setImages((current) => current.map((image, imageIndex) => {
      if (imageIndex !== index) return image;
      return { ...image, [field]: value, ...(field === "role" && value === "featured" ? { role: "featured", placement: "hero" } : {}) } as BlogImageSelection;
    }).map((image, imageIndex) => field === "role" && value === "featured" && imageIndex !== index ? { ...image, role: "body" } : image));
  }

  function removeImage(index: number) {
    setImages((current) => {
      const next = current.filter((_, imageIndex) => imageIndex !== index);
      if (next.length && !next.some((image) => image.role === "featured")) next[0] = { ...next[0], role: "featured", placement: "hero" };
      return next;
    });
  }

  async function savePost(statusOverride?: "draft" | "published") {
    setError("");
    setMessage("");
    if (!form.title.trim()) { setError("Blog title is required."); return; }
    if (images.length < 4) { setError("Choose at least 4 blog images from the picture library before saving or publishing."); return; }
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/marketing/blog-posts/${editingId}` : "/api/marketing/blog-posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form, images, statusOverride)),
      });
      const data = await readJson<BlogApiResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to save blog post.");
      setMessage(statusOverride === "published" ? "Blog post published to the public blog." : editingId ? "Blog post updated." : "Blog post saved as draft.");
      setForm(emptyForm);
      setImages(defaultBlogImages());
      setEditingId(null);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save blog post.");
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await savePost("draft");
  }

  function edit(record: BlogRecord) {
    setForm({ ...record, publish_date: record.publish_date ?? "" });
    const parsedImages = parseBlogImageSelections(record.hero_image_prompt);
    setImages(parsedImages.length ? parsedImages : defaultBlogImages());
    setEditingId(record.id);
    setMessage("");
    setError("");
  }

  async function updateStatus(record: BlogRecord, status: "draft" | "published" | "archived") {
    setError("");
    setMessage("");
    try {
      const parsedImages = parseBlogImageSelections(record.hero_image_prompt);
      if (status === "published" && parsedImages.length < 4) throw new Error("A published blog needs at least 4 selected images from the blog picture library.");
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
            <h2 className="text-xl font-semibold">{editingId ? "Edit AI blog + image package" : "Create AI blog + image package"}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Generate, refine wording, keep/change pictures, and publish from this page. This no longer sends you to the separate AI content manager.</p>
          </div>
          <button type="button" onClick={() => void loadPosts()} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-green-50">Refresh</button>
        </div>

        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="font-black text-green-950">AI Draft + Refinement</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={aiTopic} onChange={(event) => setAiTopic(event.target.value)} placeholder="Blog topic, for example: concrete cattle guard installation planning" className="rounded border border-green-200 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={generateDraft} className="rounded bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900">Generate Blog Here</button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input value={refineNote} onChange={(event) => setRefineNote(event.target.value)} placeholder="Add/refine note: add this in..." className="rounded border border-green-200 bg-white px-3 py-2 text-sm" />
            <input value={removeText} onChange={(event) => setRemoveText(event.target.value)} placeholder="Take this out: exact text to remove" className="rounded border border-green-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => refineWording("tighten")} className="rounded border border-green-800 bg-white px-3 py-2 text-xs font-bold text-green-900">Refine Wording</button>
            <button type="button" onClick={() => refineWording("expand")} className="rounded border border-green-800 bg-white px-3 py-2 text-xs font-bold text-green-900">Expand Section</button>
            <button type="button" onClick={() => refineWording("add")} className="rounded border border-green-800 bg-white px-3 py-2 text-xs font-bold text-green-900">Add This In</button>
            <button type="button" onClick={() => refineWording("remove")} className="rounded border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700">Take This Out</button>
          </div>
        </div>

        {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}
        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input label="Blog title" value={form.title} onChange={(value) => updateField("title", value)} />
          <Input label="Slug" value={form.slug} onChange={(value) => updateField("slug", slugify(value))} />
          <div className="grid gap-4 md:grid-cols-2"><Select label="Category" value={form.category} options={["Installation tips", "Cost savings", "Distributor education", "Product education", "Ranch operations", "FAQ", "SEO article"]} onChange={(value) => updateField("category", value)} /><Select label="Status" value={form.status} options={["draft", "review", "approved", "published", "archived"]} onChange={(value) => updateField("status", value)} /></div>
          <Input label="Publish date" type="date" value={form.publish_date ?? ""} onChange={(value) => updateField("publish_date", value)} />
          <Input label="SEO title" value={form.seo_title ?? ""} onChange={(value) => updateField("seo_title", value)} />
          <Input label="Meta description" value={form.meta_description ?? ""} onChange={(value) => updateField("meta_description", value)} />
          <Textarea label="Excerpt" value={form.excerpt ?? ""} onChange={(value) => updateField("excerpt", value)} />
          <Textarea label="Full blog body" value={form.body ?? ""} onChange={(value) => updateField("body", value)} />

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <h3 className="text-lg font-black text-green-950">Picture Library</h3>
            <p className="mt-2 text-sm leading-6 text-green-950">Choose at least 4 approved images: 1 featured image and 3 body images.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><select onChange={(event) => { addLibraryImage(event.target.value); event.currentTarget.value = ""; }} defaultValue="" className="rounded border border-green-200 bg-white px-3 py-2 text-sm"><option value="" disabled>Add image from library...</option>{blogImageLibrary.map((image) => <option key={image.id} value={image.id}>{image.title} - {image.category}</option>)}</select><button type="button" onClick={() => setImages(defaultBlogImages())} className="rounded border border-green-800 bg-white px-4 py-2 text-sm font-bold text-green-900 hover:bg-green-100">Keep / Use Default Pictures</button></div>
            <div className="mt-4 grid gap-3">{images.map((image, index) => <div key={`${image.id}-${index}`} className="rounded-xl bg-white p-4 ring-1 ring-green-200"><div className="grid gap-4 md:grid-cols-[120px_1fr]"><img src={image.src} alt={image.alt} className="h-24 w-full rounded-lg object-cover" /><div className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{image.title}</p><button type="button" onClick={() => removeImage(index)} className="text-xs font-bold text-red-700">Change / Remove</button></div><div className="grid gap-3 md:grid-cols-2"><Select label="Role" value={image.role} options={["featured", "body"]} onChange={(value) => updateImage(index, "role", value)} /><Select label="Placement" value={image.placement} options={["hero", "intro", "middle", "bottom", "cta"]} onChange={(value) => updateImage(index, "placement", value)} /></div><Input label="Alt text" value={image.alt} onChange={(value) => updateImage(index, "alt", value)} /><Input label="Caption" value={image.caption} onChange={(value) => updateImage(index, "caption", value)} /></div></div></div>)}</div>
          </div>

          <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded border border-green-800 bg-white px-5 py-3 text-sm font-semibold text-green-900 hover:bg-green-50 disabled:opacity-60">{saving ? "Saving..." : "Save Draft"}</button><button type="button" disabled={saving} onClick={() => void savePost("published")} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">Publish to Website Blog</button>{editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setImages(defaultBlogImages()); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button> : null}</div>
        </form>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-xl font-semibold">Web Page Post-Blog Preview</h2><div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200"><div className="h-56 bg-neutral-100">{featuredImage ? <img src={featuredImage.src} alt={featuredImage.alt} className="h-full w-full object-cover" /> : null}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-green-800">{form.category}</p><h3 className="mt-2 text-2xl font-black">{form.title || "Blog title preview"}</h3><p className="mt-3 text-sm leading-6 text-neutral-700">{form.excerpt || "Excerpt preview goes here."}</p><div className="mt-5 grid gap-3 md:grid-cols-3">{bodyImages.slice(0, 3).map((image) => <figure key={image.id}><img src={image.src} alt={image.alt} className="h-28 w-full rounded-lg object-cover" /><figcaption className="mt-2 text-xs text-neutral-500">{image.caption}</figcaption></figure>)}</div></div></div></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><h2 className="text-xl font-semibold">Website blog posts</h2><p className="mt-2 text-sm text-neutral-600">{loading ? "Loading..." : `${records.length} Supabase blog post${records.length === 1 ? "" : "s"}`}</p><div className="mt-5 space-y-3">{records.map((record) => <article key={record.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-green-800"><span>{record.category}</span><span>{record.status}</span>{record.publish_date ? <span>{record.publish_date}</span> : null}</div><h3 className="mt-2 font-semibold text-neutral-950">{record.title}</h3><p className="mt-2 text-sm leading-6 text-neutral-600">{record.excerpt || "No excerpt yet."}</p><p className="mt-2 text-xs text-neutral-500">/blog#{record.slug}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => edit(record)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-white">Edit / Refine</button>{record.status === "published" ? <button type="button" onClick={() => void updateStatus(record, "draft")} className="rounded border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50">Unpublish</button> : <button type="button" onClick={() => void updateStatus(record, "published")} className="rounded border border-green-700 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50">Publish</button>}<button type="button" onClick={() => void remove(record.id)} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button></div></div></article>)}</div></div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2 text-sm font-medium text-neutral-700">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>; }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-medium text-neutral-700">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 rounded border border-neutral-300 px-3 py-2 font-normal" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-medium text-neutral-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
