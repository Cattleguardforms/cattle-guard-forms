"use client";

import { FormEvent, useState } from "react";

type Mode = "copy" | "image" | "video" | "blog" | "seo";

type CopyFormState = {
  contentType: string;
  channel: string;
  audience: string;
  tone: string;
  offer: string;
  goal: string;
  notes: string;
};

type ImageFormState = {
  platform: string;
  imageType: string;
  audience: string;
  tone: string;
  offer: string;
  goal: string;
  headline: string;
  cta: string;
  visualNotes: string;
  size: string;
};

type VideoFormState = {
  platform: string;
  videoType: string;
  duration: string;
  audience: string;
  tone: string;
  offer: string;
  goal: string;
  cta: string;
  notes: string;
};

type BlogFormState = {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  audience: string;
  tone: string;
  goal: string;
  wordCount: string;
  notes: string;
};

type SeoFormState = {
  url: string;
  primaryKeyword: string;
};

type ApiTextResponse = {
  output?: string;
  error?: string;
};

type ApiImageResponse = {
  imageUrl?: string;
  prompt?: string;
  caption?: string;
  error?: string;
};

const contentTypes = [
  "Facebook post",
  "Instagram caption",
  "TikTok script",
  "YouTube script",
  "YouTube description",
  "Email campaign",
  "Distributor follow-up email",
  "Blog / website content",
  "Ad copy",
  "Rewrite / improve copy",
];

const channels = ["Facebook", "Instagram", "LinkedIn", "TikTok", "YouTube", "Email", "Website", "Distributor outreach", "General marketing"];
const tones = ["clear, professional, confident, practical", "friendly and simple", "strong sales-focused", "educational", "premium and polished", "short and direct", "rugged agricultural", "modern clean branded"];
const imageTypes = ["Ad creative", "Social graphic", "Product promo image", "Thumbnail", "Flyer graphic", "Educational graphic", "Distributor recruiting graphic"];
const videoTypes = ["Short-form product ad", "Educational explainer", "Distributor recruiting video", "YouTube overview", "Customer problem/solution video", "Launch/promo video"];

const defaultCopyForm: CopyFormState = {
  contentType: "Facebook post",
  channel: "Facebook",
  audience: "farmers, ranchers, land owners, contractors, concrete companies, and distributors",
  tone: "clear, professional, confident, practical",
  offer: "CowStop reusable cattle guard forms",
  goal: "generate qualified interest and make the product easy to understand",
  notes: "Focus on reusable forms, durable concrete cattle guard construction, simple installation, distributor opportunity, and practical savings. Do not invent fake stats.",
};

const defaultImageForm: ImageFormState = {
  platform: "Facebook",
  imageType: "Ad creative",
  audience: "farmers, ranchers, land owners, contractors, concrete companies, and distributors",
  tone: "professional, rugged, practical, clean",
  offer: "CowStop reusable concrete cattle guard forms",
  goal: "generate qualified leads and product interest",
  headline: "Build Better Cattle Guards",
  cta: "Request a quote",
  visualNotes: "A realistic rural ranch entrance with visible concrete cattle guard formwork, an installed or poured cattle guard context, gravel driveway, construction/ranch setting, and clean space for ad text overlay.",
  size: "1024x1024",
};

const defaultVideoForm: VideoFormState = {
  platform: "TikTok / Reels / Shorts",
  videoType: "Short-form product ad",
  duration: "30 seconds",
  audience: "farmers, ranchers, land owners, contractors, concrete companies, and distributors",
  tone: "clear, practical, confident, and sales-focused",
  offer: "CowStop reusable cattle guard forms",
  goal: "generate qualified leads and make the product easy to understand",
  cta: "Request a quote",
  notes: "Focus on reusable forms, concrete cattle guard installation, practical savings, and distributor opportunity. Do not invent fake stats.",
};

const defaultBlogForm: BlogFormState = {
  topic: "How reusable concrete cattle guard forms help ranchers save time and money",
  primaryKeyword: "concrete cattle guard forms",
  secondaryKeywords: "reusable cattle guard forms, cattle guard installation, CowStop, ranch entrance, concrete cattle guard",
  audience: "farmers, ranchers, land owners, contractors, concrete companies, and distributors",
  tone: "clear, practical, professional, SEO-friendly, and sales-aware",
  goal: "educate buyers, improve organic search visibility, and generate quote requests",
  wordCount: "1200",
  notes: "Mention CowStop reusable forms, practical installation benefits, distributor opportunity, durability, and request-a-quote CTA. Do not invent fake statistics or fake certifications.",
};

const defaultSeoForm: SeoFormState = {
  url: "https://cattle-guard-forms-4cug.vercel.app/",
  primaryKeyword: "concrete cattle guard forms",
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export default function MarketingAiClient() {
  const [mode, setMode] = useState<Mode>("copy");
  const [copyForm, setCopyForm] = useState<CopyFormState>(defaultCopyForm);
  const [imageForm, setImageForm] = useState<ImageFormState>(defaultImageForm);
  const [videoForm, setVideoForm] = useState<VideoFormState>(defaultVideoForm);
  const [blogForm, setBlogForm] = useState<BlogFormState>(defaultBlogForm);
  const [seoForm, setSeoForm] = useState<SeoFormState>(defaultSeoForm);
  const [textOutput, setTextOutput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function resetOutput() {
    setError("");
    setCopied(false);
    setTextOutput("");
    setImageUrl("");
    setImagePrompt("");
  }

  async function submitCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    resetOutput();

    try {
      const response = await fetch("/api/marketing/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyForm),
      });
      const data = await parseJson<ApiTextResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Marketing AI request failed.");
      setTextOutput(data.output ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketing AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    resetOutput();

    try {
      const response = await fetch("/api/marketing/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageForm),
      });
      const data = await parseJson<ApiImageResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Marketing image request failed.");
      setImageUrl(data.imageUrl ?? "");
      setImagePrompt(data.prompt ?? "");
      setTextOutput(data.caption ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketing image request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    resetOutput();

    try {
      const response = await fetch("/api/marketing/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoForm),
      });
      const data = await parseJson<ApiTextResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Marketing video request failed.");
      setTextOutput(data.output ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketing video request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitBlog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    resetOutput();

    try {
      const response = await fetch("/api/marketing/ai/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogForm),
      });
      const data = await parseJson<ApiTextResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "Blog generator request failed.");
      setTextOutput(data.output ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blog generator request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitSeo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    resetOutput();

    try {
      const response = await fetch("/api/marketing/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoForm),
      });
      const data = await parseJson<ApiTextResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "SEO audit request failed.");
      setTextOutput(data.output ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "SEO audit request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    const output = [textOutput, imagePrompt ? `\n\nImage prompt used:\n${imagePrompt}` : ""].join("").trim();
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
  }

  const modeTitle =
    mode === "copy"
      ? "Generate marketing copy"
      : mode === "image"
        ? "Generate marketing image"
        : mode === "video"
          ? "Generate video plan"
          : mode === "blog"
            ? "Generate SEO blog package"
            : "Run SEO tester";

  const modeDescription =
    mode === "copy"
      ? "Create first drafts for posts, emails, ads, campaigns, landing pages, and distributor outreach."
      : mode === "image"
        ? "Create ad creatives, social graphics, thumbnails, flyers, and promo images tied tightly to cattle guard forms."
        : mode === "video"
          ? "Create hooks, scripts, storyboards, shot lists, captions, and thumbnail prompts for video content."
          : mode === "blog"
            ? "Generate a full blog draft with SEO metadata, image prompt, video angle, social captions, and email repurposing."
            : "Check a live page for SEO basics like title, description, headings, keyword usage, images, links, and improvement actions.";

  return (
    <div className="mt-8">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-200">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["copy", "Copy Generator", "Ads, emails, captions"],
            ["blog", "Blog Generator", "SEO, image, social, email"],
            ["image", "Image Generator", "Ads, thumbnails, graphics"],
            ["video", "Video Planner", "Scripts, storyboards"],
            ["seo", "SEO Tester", "Page audit and fixes"],
          ].map(([key, label, note]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key as Mode); setError(""); setCopied(false); }}
              className={`rounded-xl p-4 text-left ring-1 transition ${mode === key ? "bg-green-800 text-white ring-green-800" : "bg-white text-neutral-900 ring-neutral-200 hover:bg-green-50 hover:ring-green-800"}`}
            >
              <span className="block font-semibold">{label}</span>
              <span className={`mt-1 block text-sm ${mode === key ? "text-green-50" : "text-neutral-600"}`}>{note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-xl font-semibold">{modeTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{modeDescription}</p>

          {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

          {mode === "copy" ? (
            <form onSubmit={submitCopy} className="mt-6 grid gap-4">
              <Select label="Content type" value={copyForm.contentType} options={contentTypes} onChange={(value) => setCopyForm((current) => ({ ...current, contentType: value }))} />
              <Select label="Channel" value={copyForm.channel} options={channels} onChange={(value) => setCopyForm((current) => ({ ...current, channel: value }))} />
              <Input label="Audience" value={copyForm.audience} onChange={(value) => setCopyForm((current) => ({ ...current, audience: value }))} />
              <Select label="Tone" value={copyForm.tone} options={tones} onChange={(value) => setCopyForm((current) => ({ ...current, tone: value }))} />
              <Input label="Product / offer" value={copyForm.offer} onChange={(value) => setCopyForm((current) => ({ ...current, offer: value }))} />
              <Input label="Goal" value={copyForm.goal} onChange={(value) => setCopyForm((current) => ({ ...current, goal: value }))} />
              <Textarea label="Notes / facts to include" value={copyForm.notes} onChange={(value) => setCopyForm((current) => ({ ...current, notes: value }))} />
              <SubmitButton loading={loading} label="Generate Copy" />
            </form>
          ) : null}

          {mode === "blog" ? (
            <form onSubmit={submitBlog} className="mt-6 grid gap-4">
              <Input label="Blog topic" value={blogForm.topic} onChange={(value) => setBlogForm((current) => ({ ...current, topic: value }))} />
              <Input label="Primary SEO keyword" value={blogForm.primaryKeyword} onChange={(value) => setBlogForm((current) => ({ ...current, primaryKeyword: value }))} />
              <Textarea label="Secondary keywords" value={blogForm.secondaryKeywords} onChange={(value) => setBlogForm((current) => ({ ...current, secondaryKeywords: value }))} />
              <Input label="Audience" value={blogForm.audience} onChange={(value) => setBlogForm((current) => ({ ...current, audience: value }))} />
              <Select label="Tone" value={blogForm.tone} options={tones} onChange={(value) => setBlogForm((current) => ({ ...current, tone: value }))} />
              <Input label="Goal" value={blogForm.goal} onChange={(value) => setBlogForm((current) => ({ ...current, goal: value }))} />
              <Select label="Target length" value={blogForm.wordCount} options={["800", "1200", "1600", "2200"]} onChange={(value) => setBlogForm((current) => ({ ...current, wordCount: value }))} />
              <Textarea label="Facts, offers, constraints" value={blogForm.notes} onChange={(value) => setBlogForm((current) => ({ ...current, notes: value }))} />
              <SubmitButton loading={loading} label="Generate Blog Package" />
            </form>
          ) : null}

          {mode === "image" ? (
            <form onSubmit={submitImage} className="mt-6 grid gap-4">
              <Select label="Platform" value={imageForm.platform} options={channels} onChange={(value) => setImageForm((current) => ({ ...current, platform: value }))} />
              <Select label="Image type" value={imageForm.imageType} options={imageTypes} onChange={(value) => setImageForm((current) => ({ ...current, imageType: value }))} />
              <Input label="Audience" value={imageForm.audience} onChange={(value) => setImageForm((current) => ({ ...current, audience: value }))} />
              <Select label="Tone / style" value={imageForm.tone} options={tones} onChange={(value) => setImageForm((current) => ({ ...current, tone: value }))} />
              <Input label="Product / offer" value={imageForm.offer} onChange={(value) => setImageForm((current) => ({ ...current, offer: value }))} />
              <Input label="Goal" value={imageForm.goal} onChange={(value) => setImageForm((current) => ({ ...current, goal: value }))} />
              <Input label="Headline text" value={imageForm.headline} onChange={(value) => setImageForm((current) => ({ ...current, headline: value }))} />
              <Input label="CTA text" value={imageForm.cta} onChange={(value) => setImageForm((current) => ({ ...current, cta: value }))} />
              <Select label="Size / aspect ratio" value={imageForm.size} options={["1024x1024", "1024x1536", "1536x1024"]} onChange={(value) => setImageForm((current) => ({ ...current, size: value }))} />
              <Textarea label="Visual notes" value={imageForm.visualNotes} onChange={(value) => setImageForm((current) => ({ ...current, visualNotes: value }))} />
              <SubmitButton loading={loading} label="Generate Image" />
            </form>
          ) : null}

          {mode === "video" ? (
            <form onSubmit={submitVideo} className="mt-6 grid gap-4">
              <Select label="Platform" value={videoForm.platform} options={["TikTok / Reels / Shorts", "YouTube", "Facebook", "Instagram", "LinkedIn", "Website"]} onChange={(value) => setVideoForm((current) => ({ ...current, platform: value }))} />
              <Select label="Video type" value={videoForm.videoType} options={videoTypes} onChange={(value) => setVideoForm((current) => ({ ...current, videoType: value }))} />
              <Select label="Duration" value={videoForm.duration} options={["15 seconds", "30 seconds", "45 seconds", "60 seconds", "2 minutes"]} onChange={(value) => setVideoForm((current) => ({ ...current, duration: value }))} />
              <Input label="Audience" value={videoForm.audience} onChange={(value) => setVideoForm((current) => ({ ...current, audience: value }))} />
              <Select label="Tone" value={videoForm.tone} options={tones} onChange={(value) => setVideoForm((current) => ({ ...current, tone: value }))} />
              <Input label="Product / offer" value={videoForm.offer} onChange={(value) => setVideoForm((current) => ({ ...current, offer: value }))} />
              <Input label="Goal" value={videoForm.goal} onChange={(value) => setVideoForm((current) => ({ ...current, goal: value }))} />
              <Input label="CTA" value={videoForm.cta} onChange={(value) => setVideoForm((current) => ({ ...current, cta: value }))} />
              <Textarea label="Notes / facts to include" value={videoForm.notes} onChange={(value) => setVideoForm((current) => ({ ...current, notes: value }))} />
              <SubmitButton loading={loading} label="Generate Video Plan" />
            </form>
          ) : null}

          {mode === "seo" ? (
            <form onSubmit={submitSeo} className="mt-6 grid gap-4">
              <Input label="Page URL to test" value={seoForm.url} onChange={(value) => setSeoForm((current) => ({ ...current, url: value }))} />
              <Input label="Primary keyword" value={seoForm.primaryKeyword} onChange={(value) => setSeoForm((current) => ({ ...current, primaryKeyword: value }))} />
              <SubmitButton loading={loading} label="Run SEO Test" />
            </form>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Studio output</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Copy this into Marketing Posts, Campaigns, Marketing Content, the website blog, or email campaigns.</p>
            </div>
            <button type="button" onClick={copyOutput} disabled={!textOutput && !imagePrompt} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
              {copied ? "Copied" : "Copy output"}
            </button>
          </div>

          {imageUrl ? (
            <div className="mt-5 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
              <img src={imageUrl} alt="Generated marketing creative" className="w-full rounded-lg object-contain" />
            </div>
          ) : null}

          <div className="mt-5 min-h-[24rem] whitespace-pre-wrap rounded-xl bg-neutral-50 p-5 text-sm leading-7 text-neutral-800 ring-1 ring-neutral-200">
            {textOutput || (loading ? "Generating..." : "Generated content will appear here.")}
            {imagePrompt ? `\n\nImage prompt used:\n${imagePrompt}` : ""}
          </div>
        </section>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-32 rounded border border-neutral-300 px-3 py-2 font-normal" />
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

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-neutral-400">
      {loading ? "Generating..." : label}
    </button>
  );
}
