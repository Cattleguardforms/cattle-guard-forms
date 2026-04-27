import { NextRequest, NextResponse } from "next/server";

type SeoAuditRequest = {
  url?: string;
  primaryKeyword?: string;
};

type PageSignals = {
  url: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  imageCount: number;
  imagesMissingAlt: number;
  internalLinkCount: number;
  externalLinkCount: number;
  wordCount: number;
  keywordCount: number;
  hasCanonical: boolean;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
};

type OpenAiTextContent = {
  text?: unknown;
};

type OpenAiOutputItem = {
  content?: OpenAiTextContent[];
};

type OpenAiResponsePayload = {
  output_text?: unknown;
  output?: OpenAiOutputItem[];
  error?: {
    message?: unknown;
  };
};

function safeValue(value: unknown, fallback: string, maxLength = 2000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function extractFirst(html: string, regex: RegExp) {
  return html.match(regex)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function extractAll(html: string, regex: RegExp) {
  return Array.from(html.matchAll(regex)).map((match) => match[1]?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? "").filter(Boolean);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countOccurrences(text: string, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase().trim();
  if (!normalizedKeyword) return 0;
  return text.toLowerCase().split(normalizedKeyword).length - 1;
}

function analyzePage(url: string, html: string, primaryKeyword: string): PageSignals {
  const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = extractFirst(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || extractFirst(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const h1s = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2s = extractAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const imageTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((match) => match[0]);
  const imagesMissingAlt = imageTags.filter((tag) => !/\balt=["'][^"']+["']/i.test(tag)).length;
  const links = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1] ?? "");
  const internalLinkCount = links.filter((href) => href.startsWith("/") || href.includes(new URL(url).hostname)).length;
  const externalLinkCount = links.filter((href) => href.startsWith("http") && !href.includes(new URL(url).hostname)).length;
  const text = stripHtml(html);
  const words = text ? text.split(/\s+/).length : 0;

  return {
    url,
    title,
    metaDescription,
    h1s,
    h2s,
    imageCount: imageTags.length,
    imagesMissingAlt,
    internalLinkCount,
    externalLinkCount,
    wordCount: words,
    keywordCount: countOccurrences(text, primaryKeyword),
    hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
    hasOgTitle: /<meta[^>]+property=["']og:title["']/i.test(html),
    hasOgDescription: /<meta[^>]+property=["']og:description["']/i.test(html),
  };
}

function extractOutputText(data: OpenAiResponsePayload) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks: string[] = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") chunks.push(content.text);
    }
  }

  return chunks.join("\n").trim();
}

function buildLocalScore(signals: PageSignals) {
  let score = 100;
  if (!signals.title) score -= 15;
  if (signals.title.length > 65) score -= 5;
  if (!signals.metaDescription) score -= 15;
  if (signals.metaDescription.length > 170) score -= 5;
  if (signals.h1s.length !== 1) score -= 10;
  if (signals.h2s.length < 2) score -= 8;
  if (signals.wordCount < 400) score -= 12;
  if (signals.keywordCount < 2) score -= 10;
  if (signals.imagesMissingAlt > 0) score -= Math.min(10, signals.imagesMissingAlt * 2);
  if (!signals.hasCanonical) score -= 5;
  if (!signals.hasOgTitle || !signals.hasOgDescription) score -= 5;
  if (signals.internalLinkCount < 2) score -= 5;
  return Math.max(0, Math.min(100, score));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let body: SeoAuditRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawUrl = safeValue(body.url, "", 500);
  const primaryKeyword = safeValue(body.primaryKeyword, "concrete cattle guard forms", 200);

  let url: string;
  try {
    url = new URL(rawUrl).toString();
  } catch {
    return NextResponse.json({ error: "Enter a valid absolute URL, including https://." }, { status: 400 });
  }

  try {
    const pageResponse = await fetch(url, { cache: "no-store" });
    if (!pageResponse.ok) {
      return NextResponse.json({ error: `Could not fetch page. Status: ${pageResponse.status}` }, { status: 502 });
    }

    const html = await pageResponse.text();
    const signals = analyzePage(url, html, primaryKeyword);
    const localScore = buildLocalScore(signals);

    const prompt = `Audit this page for SEO performance for Cattle Guard Forms.\n\nURL: ${signals.url}\nPrimary keyword: ${primaryKeyword}\nLocal technical score: ${localScore}/100\n\nSignals:\nTitle: ${signals.title || "missing"}\nMeta description: ${signals.metaDescription || "missing"}\nH1s: ${signals.h1s.join(" | ") || "none"}\nH2s: ${signals.h2s.join(" | ") || "none"}\nWord count: ${signals.wordCount}\nKeyword occurrences: ${signals.keywordCount}\nImages: ${signals.imageCount}\nImages missing alt: ${signals.imagesMissingAlt}\nInternal links: ${signals.internalLinkCount}\nExternal links: ${signals.externalLinkCount}\nCanonical: ${signals.hasCanonical ? "yes" : "no"}\nOpen Graph title: ${signals.hasOgTitle ? "yes" : "no"}\nOpen Graph description: ${signals.hasOgDescription ? "yes" : "no"}\n\nOutput these sections:\n1. SEO Score and Verdict\n2. Top Problems\n3. Quick Fixes\n4. Better Title Tag\n5. Better Meta Description\n6. Heading Improvement Plan\n7. Keyword Usage Improvements\n8. Internal Link Suggestions\n9. Image Alt Text Suggestions\n10. Content Expansion Ideas\n11. Priority Action Checklist\n\nBe practical and specific to concrete cattle guard forms, CowStop, ranch/farm buyers, contractors, distributors, and quote generation.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MARKETING_MODEL ?? "gpt-4.1-mini",
        instructions:
          "You are a technical SEO auditor and B2B content strategist. You give blunt, practical fixes and do not pretend to have search console data unless provided.",
        input: prompt,
        max_output_tokens: 2400,
      }),
    });

    const data = (await response.json()) as OpenAiResponsePayload;
    if (!response.ok) {
      const message = typeof data.error?.message === "string" ? data.error.message : "OpenAI SEO audit request failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const output = extractOutputText(data);
    if (!output) {
      return NextResponse.json({ error: "OpenAI returned an empty SEO audit." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SEO audit request failed." },
      { status: 500 }
    );
  }
}
