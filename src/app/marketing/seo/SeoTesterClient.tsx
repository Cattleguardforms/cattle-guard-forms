"use client";

import { FormEvent, useState } from "react";

type AuditResponse = {
  output?: string;
  error?: string;
};

type CrawlResponse = {
  output?: string;
  error?: string;
};

type OptimizeResponse = {
  output?: string;
  error?: string;
};

type Mode = "crawl" | "page";

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export default function SeoTesterClient() {
  const [mode, setMode] = useState<Mode>("crawl");
  const [baseUrl, setBaseUrl] = useState("https://cattle-guard-forms-4cug.vercel.app/");
  const [pageUrl, setPageUrl] = useState("https://cattle-guard-forms-4cug.vercel.app/");
  const [primaryKeyword, setPrimaryKeyword] = useState("concrete cattle guard forms");
  const [businessGoal, setBusinessGoal] = useState("Increase qualified quote requests for CowStop reusable concrete cattle guard forms, support distributor interest, and improve organic search visibility.");
  const [paths, setPaths] = useState(["/", "/quote", "/installations", "/faq", "/blog", "/contact", "/distributor", "/engineering/hs20-updated", "/accessibility"].join("\n"));
  const [output, setOutput] = useState("");
  const [lastReport, setLastReport] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runCrawl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    setCopied(false);

    try {
      const response = await fetch("/api/marketing/seo/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, primaryKeyword, paths }),
      });
      const data = await readJson<CrawlResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "SEO crawl failed.");
      const report = data.output ?? "";
      setOutput(report);
      setLastReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SEO crawl failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runPageAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    setCopied(false);

    try {
      const response = await fetch("/api/marketing/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pageUrl, primaryKeyword }),
      });
      const data = await readJson<AuditResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "SEO page audit failed.");
      const report = data.output ?? "";
      setOutput(report);
      setLastReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SEO page audit failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runAiOptimizer() {
    if (!lastReport && !output) {
      setError("Run a site crawl or page audit first, then optimize the report.");
      return;
    }

    setOptimizing(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/marketing/seo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: lastReport || output,
          baseUrl,
          primaryKeyword,
          businessGoal,
        }),
      });
      const data = await readJson<OptimizeResponse>(response);
      if (!response.ok) throw new Error(data.error ?? "AI SEO optimizer failed.");
      setOutput(data.output ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI SEO optimizer failed.");
    } finally {
      setOptimizing(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("crawl")}
            className={`rounded-xl p-4 text-left ring-1 ${mode === "crawl" ? "bg-green-800 text-white ring-green-800" : "bg-white text-neutral-900 ring-neutral-200 hover:bg-green-50"}`}
          >
            <span className="block font-semibold">Sitewide SEO Crawl</span>
            <span className={`mt-1 block text-sm ${mode === "crawl" ? "text-green-50" : "text-neutral-600"}`}>Rank all key pages and find weak spots.</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("page")}
            className={`rounded-xl p-4 text-left ring-1 ${mode === "page" ? "bg-green-800 text-white ring-green-800" : "bg-white text-neutral-900 ring-neutral-200 hover:bg-green-50"}`}
          >
            <span className="block font-semibold">Single Page Audit</span>
            <span className={`mt-1 block text-sm ${mode === "page" ? "text-green-50" : "text-neutral-600"}`}>Inspect one URL in detail.</span>
          </button>
        </div>

        {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-950">AI SEO Optimizer</h3>
          <p className="mt-2 text-sm leading-6 text-green-900">
            After a crawl or page audit, run this to turn the report into page-by-page title tags, meta descriptions, H1/H2 fixes, body copy, internal links, blog topics, and a 30-day execution plan.
          </p>
          <label className="mt-4 grid gap-2 text-sm font-medium text-green-950">
            Business goal
            <textarea value={businessGoal} onChange={(event) => setBusinessGoal(event.target.value)} className="min-h-24 rounded border border-green-200 px-3 py-2 font-normal text-neutral-900" />
          </label>
          <button type="button" onClick={runAiOptimizer} disabled={optimizing || (!lastReport && !output)} className="mt-4 rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60">
            {optimizing ? "Optimizing SEO..." : "Run AI SEO Optimizer"}
          </button>
        </div>

        {mode === "crawl" ? (
          <form onSubmit={runCrawl} className="mt-6 grid gap-4">
            <Input label="Base site URL" value={baseUrl} onChange={setBaseUrl} />
            <Input label="Primary keyword" value={primaryKeyword} onChange={setPrimaryKeyword} />
            <Textarea label="Paths to crawl, one per line" value={paths} onChange={setPaths} />
            <button type="submit" disabled={loading} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">
              {loading ? "Crawling Site..." : "Run Sitewide SEO Ranking"}
            </button>
          </form>
        ) : (
          <form onSubmit={runPageAudit} className="mt-6 grid gap-4">
            <Input label="Page URL" value={pageUrl} onChange={setPageUrl} />
            <Input label="Primary keyword" value={primaryKeyword} onChange={setPrimaryKeyword} />
            <button type="submit" disabled={loading} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">
              {loading ? "Auditing Page..." : "Run Page SEO Audit"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">SEO report / optimization plan</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Use this to prioritize title tags, meta descriptions, content depth, keyword targeting, alt text, internal links, and AI-generated page fixes.</p>
          </div>
          <button type="button" onClick={copyOutput} disabled={!output} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
            {copied ? "Copied" : "Copy report"}
          </button>
        </div>
        <div className="mt-5 min-h-[32rem] whitespace-pre-wrap rounded-xl bg-neutral-50 p-5 text-sm leading-7 text-neutral-800 ring-1 ring-neutral-200">
          {output || (loading || optimizing ? "Running SEO tool..." : "Run a crawl or page audit to see the SEO report here. Then use AI SEO Optimizer for recommended copy and fixes.")}
        </div>
      </section>
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
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-48 rounded border border-neutral-300 px-3 py-2 font-mono text-xs font-normal" />
    </label>
  );
}
