"use client";

import { FormEvent, useState } from "react";

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

const channels = ["Facebook", "Instagram", "TikTok", "YouTube", "Email", "Website", "Distributor outreach", "General marketing"];
const tones = ["clear, professional, confident, practical", "friendly and simple", "strong sales-focused", "educational", "premium and polished", "short and direct"];

type FormState = {
  contentType: string;
  channel: string;
  audience: string;
  tone: string;
  offer: string;
  goal: string;
  notes: string;
};

const defaultForm: FormState = {
  contentType: "Facebook post",
  channel: "Facebook",
  audience: "farmers, ranchers, land owners, contractors, concrete companies, and distributors",
  tone: "clear, professional, confident, practical",
  offer: "CowStop reusable cattle guard forms",
  goal: "generate qualified interest and make the product easy to understand",
  notes: "Focus on reusable forms, durable concrete cattle guard construction, simple installation, distributor opportunity, and practical savings. Do not invent fake stats.",
};

export default function MarketingAiClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/marketing/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Marketing AI request failed.");
      }

      setOutput(data.output ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketing AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-xl font-semibold">Generate marketing content</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Use this to create first drafts for social posts, videos, emails, website copy, distributor outreach, and campaigns.
        </p>

        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Content type
            <select value={form.contentType} onChange={(event) => updateField("contentType", event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
              {contentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Channel
            <select value={form.channel} onChange={(event) => updateField("channel", event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
              {channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Audience
            <input value={form.audience} onChange={(event) => updateField("audience", event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Tone
            <select value={form.tone} onChange={(event) => updateField("tone", event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
              {tones.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Product / offer
            <input value={form.offer} onChange={(event) => updateField("offer", event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Goal
            <input value={form.goal} onChange={(event) => updateField("goal", event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Notes / facts to include
            <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} className="min-h-32 rounded border border-neutral-300 px-3 py-2 font-normal" />
          </label>

          <button type="submit" disabled={loading} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-neutral-400">
            {loading ? "Generating..." : "Generate with ChatGPT"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">AI output</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Copy this into Marketing Posts, Campaigns, Email Activity, or the social pages.</p>
          </div>
          <button type="button" onClick={copyOutput} disabled={!output} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
            {copied ? "Copied" : "Copy output"}
          </button>
        </div>

        <div className="mt-5 min-h-[28rem] whitespace-pre-wrap rounded-xl bg-neutral-50 p-5 text-sm leading-7 text-neutral-800 ring-1 ring-neutral-200">
          {output || "Generated marketing content will appear here."}
        </div>
      </section>
    </div>
  );
}
