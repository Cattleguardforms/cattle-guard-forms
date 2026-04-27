import { NextRequest, NextResponse } from "next/server";

type SeoOptimizeRequest = {
  report?: string;
  baseUrl?: string;
  primaryKeyword?: string;
  businessGoal?: string;
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

function safeValue(value: unknown, fallback: string, maxLength = 12000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
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

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let body: SeoOptimizeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const report = safeValue(body.report, "", 16000);
  if (!report) {
    return NextResponse.json({ error: "Run a site crawl or page audit before optimizing." }, { status: 400 });
  }

  const baseUrl = safeValue(body.baseUrl, "https://cattle-guard-forms-4cug.vercel.app/", 500);
  const primaryKeyword = safeValue(body.primaryKeyword, "concrete cattle guard forms", 200);
  const businessGoal = safeValue(
    body.businessGoal,
    "Increase qualified quote requests for CowStop reusable concrete cattle guard forms, support distributor interest, and improve organic search visibility for cattle guard installation, concrete cattle guard forms, ranch entrances, and reusable formwork.",
    1000
  );

  const prompt = `Create an AI SEO optimization plan for Cattle Guard Forms based on this SEO report.\n\nSite: ${baseUrl}\nPrimary keyword: ${primaryKeyword}\nBusiness goal: ${businessGoal}\n\nSEO report:\n${report}\n\nOutput exactly these sections:\n\n1. Executive SEO Verdict\n- State the current SEO problem in plain language.\n\n2. Priority Fix Queue\n- Rank the top 10 fixes by business impact.\n- Include page, issue, recommended change, and why it matters.\n\n3. Page-by-Page Optimization Copy\nFor each weak page, provide:\n- New title tag\n- New meta description\n- Recommended H1 if needed\n- 3 to 6 H2 section ideas\n- 150 to 250 words of new body copy that can be added to the page\n- Internal links to add\n- Image alt text ideas\n\n4. Keyword Map\n- Assign primary and secondary keywords by page.\n- Avoid keyword cannibalization.\n\n5. Internal Linking Plan\n- Exact source page → target page links to add.\n- Suggested anchor text.\n\n6. Blog Content Plan\n- 10 blog topics targeting long-tail searches.\n- Include primary keyword, search intent, and CTA for each.\n\n7. Technical SEO Fixes\n- Canonical tags, Open Graph, title templates, meta templates, schema ideas.\n\n8. Conversion SEO Fixes\n- Quote request CTAs, distributor CTAs, product trust sections, FAQ additions.\n\n9. 30-Day Execution Plan\n- Week 1, Week 2, Week 3, Week 4.\n\nRules:\n- Be specific to CowStop, reusable concrete cattle guard forms, cattle guard installation, ranch/farm entrances, contractors, concrete companies, landowners, and distributors.\n- Do not invent fake statistics, certifications, awards, testimonials, or prices.\n- Prioritize practical fixes that can be implemented in the website code or blog manager.\n- Keep copy ready to paste into website pages.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MARKETING_MODEL ?? "gpt-4.1-mini",
        instructions:
          "You are a senior technical SEO strategist and conversion copywriter for a B2B agricultural/construction product website. You give blunt, implementation-ready SEO optimization plans.",
        input: prompt,
        max_output_tokens: 5000,
      }),
    });

    const data = (await response.json()) as OpenAiResponsePayload;

    if (!response.ok) {
      const message = typeof data.error?.message === "string" ? data.error.message : "OpenAI SEO optimizer request failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const output = extractOutputText(data);
    if (!output) {
      return NextResponse.json({ error: "OpenAI returned an empty SEO optimization plan." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SEO optimizer request failed." },
      { status: 500 }
    );
  }
}
