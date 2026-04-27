import { NextRequest, NextResponse } from "next/server";

type SeoCrawlRequest = {
  baseUrl?: string;
  primaryKeyword?: string;
  paths?: string;
};

type PageSignals = {
  url: string;
  path: string;
  status: number;
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
  score: number;
  problems: string[];
};

const defaultPaths = [
  "/",
  "/quote",
  "/installations",
  "/faq",
  "/blog",
  "/contact",
  "/distributor",
  "/engineering/hs20-updated",
  "/accessibility",
];

function safeValue(value: unknown, fallback: string, maxLength = 2000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function extractFirst(html: string, regex: RegExp) {
  return html.match(regex)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function extractAll(html: string, regex: RegExp) {
  return Array.from(html.matchAll(regex))
    .map((match) => match[1]?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);
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

function normalizePaths(pathsValue: string) {
  const paths = pathsValue
    .split(/[\n,]/)
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => (path.startsWith("/") ? path : `/${path}`));

  return Array.from(new Set(paths.length ? paths : defaultPaths)).slice(0, 25);
}

function scorePage(signals: Omit<PageSignals, "score" | "problems">) {
  let score = 100;
  const problems: string[] = [];

  if (!signals.title) {
    score -= 15;
    problems.push("Missing title tag.");
  } else {
    if (signals.title.length > 65) {
      score -= 5;
      problems.push("Title tag may be too long.");
    }
    if (signals.keywordCount === 0 && !signals.title.toLowerCase().includes("cattle")) {
      score -= 5;
      problems.push("Title may not align strongly with target cattle guard keywords.");
    }
  }

  if (!signals.metaDescription) {
    score -= 15;
    problems.push("Missing meta description.");
  } else if (signals.metaDescription.length > 170) {
    score -= 5;
    problems.push("Meta description may be too long.");
  }

  if (signals.h1s.length !== 1) {
    score -= 10;
    problems.push(`Expected exactly one H1, found ${signals.h1s.length}.`);
  }

  if (signals.h2s.length < 2) {
    score -= 8;
    problems.push("Needs more H2 section structure.");
  }

  if (signals.wordCount < 400) {
    score -= 12;
    problems.push("Thin page content under roughly 400 words.");
  }

  if (signals.keywordCount < 2) {
    score -= 10;
    problems.push("Primary keyword is underused on the page.");
  }

  if (signals.imagesMissingAlt > 0) {
    const penalty = Math.min(10, signals.imagesMissingAlt * 2);
    score -= penalty;
    problems.push(`${signals.imagesMissingAlt} image(s) missing alt text.`);
  }

  if (!signals.hasCanonical) {
    score -= 5;
    problems.push("Missing canonical tag.");
  }

  if (!signals.hasOgTitle || !signals.hasOgDescription) {
    score -= 5;
    problems.push("Open Graph title/description is incomplete.");
  }

  if (signals.internalLinkCount < 2) {
    score -= 5;
    problems.push("Needs more internal links.");
  }

  return { score: Math.max(0, Math.min(100, score)), problems };
}

function analyzePage(baseUrl: URL, path: string, html: string, status: number, primaryKeyword: string): PageSignals {
  const url = new URL(path, baseUrl).toString();
  const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription =
    extractFirst(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
    extractFirst(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const h1s = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2s = extractAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const imageTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((match) => match[0]);
  const imagesMissingAlt = imageTags.filter((tag) => !/\balt=["'][^"']+["']/i.test(tag)).length;
  const links = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1] ?? "");
  const internalLinkCount = links.filter((href) => href.startsWith("/") || href.includes(baseUrl.hostname)).length;
  const externalLinkCount = links.filter((href) => href.startsWith("http") && !href.includes(baseUrl.hostname)).length;
  const text = stripHtml(html);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const keywordCount = countOccurrences(text, primaryKeyword);

  const baseSignals = {
    url,
    path,
    status,
    title,
    metaDescription,
    h1s,
    h2s,
    imageCount: imageTags.length,
    imagesMissingAlt,
    internalLinkCount,
    externalLinkCount,
    wordCount,
    keywordCount,
    hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
    hasOgTitle: /<meta[^>]+property=["']og:title["']/i.test(html),
    hasOgDescription: /<meta[^>]+property=["']og:description["']/i.test(html),
  };

  const { score, problems } = scorePage(baseSignals);
  return { ...baseSignals, score, problems };
}

function renderReport(baseUrl: string, primaryKeyword: string, pages: PageSignals[]) {
  const sorted = [...pages].sort((a, b) => b.score - a.score);
  const average = pages.length ? Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length) : 0;
  const weakPages = [...pages].sort((a, b) => a.score - b.score).slice(0, 5);
  const totalMissingAlt = pages.reduce((sum, page) => sum + page.imagesMissingAlt, 0);
  const thinPages = pages.filter((page) => page.wordCount < 400).length;
  const missingMeta = pages.filter((page) => !page.metaDescription).length;

  return [
    `# Sitewide SEO Crawl Ranking`,
    ``,
    `Site: ${baseUrl}`,
    `Primary keyword: ${primaryKeyword}`,
    `Pages crawled: ${pages.length}`,
    `Average SEO score: ${average}/100`,
    ``,
    `## Sitewide Problems`,
    `- Pages missing meta descriptions: ${missingMeta}`,
    `- Thin pages under roughly 400 words: ${thinPages}`,
    `- Images missing alt text: ${totalMissingAlt}`,
    ``,
    `## Ranked Pages`,
    ...sorted.map((page, index) => [
      `${index + 1}. ${page.path} — ${page.score}/100`,
      `   - Title: ${page.title || "missing"}`,
      `   - Words: ${page.wordCount}; keyword uses: ${page.keywordCount}; H1s: ${page.h1s.length}; H2s: ${page.h2s.length}; missing alt: ${page.imagesMissingAlt}`,
      `   - Top issues: ${page.problems.slice(0, 3).join(" | ") || "No major basic SEO issues detected."}`,
    ].join("\n")),
    ``,
    `## Worst Pages To Fix First`,
    ...weakPages.map((page) => `- ${page.path} (${page.score}/100): ${page.problems.slice(0, 4).join("; ") || "Improve page depth and keyword targeting."}`),
    ``,
    `## Highest-Impact Next Actions`,
    `1. Add or improve title/meta descriptions on weak pages.`,
    `2. Strengthen H1/H2 structure around concrete cattle guard forms, CowStop, cattle guard installation, ranch entrances, and distributor intent.`,
    `3. Add useful body copy to thin pages, especially product, quote, distributor, and installation pages.`,
    `4. Add descriptive alt text to product and installation images.`,
    `5. Add internal links between /quote, /installations, /faq, /blog, and product/engineering pages.`,
    `6. Publish more blog posts targeting long-tail cattle guard searches and link them back to quote/product pages.`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let body: SeoCrawlRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const baseUrlValue = safeValue(body.baseUrl, "", 500);
  const primaryKeyword = safeValue(body.primaryKeyword, "concrete cattle guard forms", 200);
  const paths = normalizePaths(safeValue(body.paths, defaultPaths.join("\n"), 4000));

  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlValue);
  } catch {
    return NextResponse.json({ error: "Enter a valid base URL, including https://." }, { status: 400 });
  }

  const pages: PageSignals[] = [];

  for (const path of paths) {
    try {
      const url = new URL(path, baseUrl).toString();
      const response = await fetch(url, { cache: "no-store" });
      const html = await response.text();
      pages.push(analyzePage(baseUrl, path, html, response.status, primaryKeyword));
    } catch {
      pages.push({
        url: new URL(path, baseUrl).toString(),
        path,
        status: 0,
        title: "",
        metaDescription: "",
        h1s: [],
        h2s: [],
        imageCount: 0,
        imagesMissingAlt: 0,
        internalLinkCount: 0,
        externalLinkCount: 0,
        wordCount: 0,
        keywordCount: 0,
        hasCanonical: false,
        hasOgTitle: false,
        hasOgDescription: false,
        score: 0,
        problems: ["Could not fetch this page."],
      });
    }
  }

  return NextResponse.json({
    output: renderReport(baseUrl.toString(), primaryKeyword, pages),
    pages,
  });
}
