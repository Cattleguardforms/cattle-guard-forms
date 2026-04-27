import { NextRequest, NextResponse } from "next/server";

type BlogRequest = {
  topic?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  audience?: string;
  tone?: string;
  goal?: string;
  wordCount?: string;
  notes?: string;
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

function safeValue(value: unknown, fallback: string, maxLength = 4000) {
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

  let body: BlogRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = safeValue(body.topic, "How reusable concrete cattle guard forms help ranchers save time and money");
  const primaryKeyword = safeValue(body.primaryKeyword, "concrete cattle guard forms", 200);
  const secondaryKeywords = safeValue(body.secondaryKeywords, "reusable cattle guard forms, cattle guard installation, CowStop, ranch entrance, concrete cattle guard");
  const audience = safeValue(body.audience, "farmers, ranchers, land owners, contractors, concrete companies, and distributors");
  const tone = safeValue(body.tone, "clear, practical, professional, SEO-friendly, and sales-aware", 300);
  const goal = safeValue(body.goal, "educate buyers, improve organic search visibility, and generate quote requests");
  const wordCount = safeValue(body.wordCount, "1200", 20);
  const notes = safeValue(body.notes, "Mention CowStop reusable forms, practical installation benefits, distributor opportunity, durability, and request-a-quote CTA. Do not invent fake statistics or fake certifications.");

  const prompt = `Create a complete SEO blog package for Cattle Guard Forms.\n\nTopic: ${topic}\nPrimary keyword: ${primaryKeyword}\nSecondary keywords: ${secondaryKeywords}\nAudience: ${audience}\nTone: ${tone}\nGoal: ${goal}\nTarget length: about ${wordCount} words\nFacts/constraints: ${notes}\n\nOutput exactly these sections:\n\n1. SEO Title\n- 1 title under 60 characters if possible.\n\n2. URL Slug\n- lowercase hyphenated slug.\n\n3. Meta Description\n- 145 to 160 characters if possible.\n\n4. Excerpt\n- 2 short sentences.\n\n5. SEO Keyword Plan\n- primary keyword\n- secondary keywords\n- search intent\n- internal link suggestions\n\n6. Full Blog Draft\n- Use H2 and H3 headings.\n- Include the primary keyword naturally in the intro and at least one heading.\n- Do not keyword stuff.\n- Do not invent fake statistics, fake testimonials, fake certifications, fake prices, or fake guarantees.\n- Mention CowStop only in practical context.\n- End with a quote/request CTA.\n\n7. Blog Hero Image Prompt\n- Make the image clearly about concrete cattle guard forms, ranch/farm entrances, concrete formwork, or cattle guard installation.\n- Avoid generic livestock-only imagery.\n- Leave space for headline overlay.\n\n8. Supporting Image Prompts\n- 3 image prompt ideas for social/blog sections.\n\n9. Video Repurpose Package\n- 30-second short-form script\n- 60-second educational script\n- YouTube title\n- YouTube description\n- thumbnail prompt\n\n10. Social Repurpose Package\n- Facebook post\n- LinkedIn post\n- Instagram caption\n- 8 hashtags\n\n11. Email Repurpose Package\n- subject line options\n- preview text\n- short email body\n- CTA\n\n12. Publishing Checklist\n- title tag\n- meta description\n- H1/H2 check\n- internal links\n- image alt text ideas\n- CTA placement\n`;

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
          "You are a senior B2B SEO content strategist for Cattle Guard Forms. You create accurate, practical, sales-aware SEO blog packages for agricultural, ranch, construction, and distributor audiences. You never invent unsupported claims.",
        input: prompt,
        max_output_tokens: 5000,
      }),
    });

    const data = (await response.json()) as OpenAiResponsePayload;

    if (!response.ok) {
      const message = typeof data.error?.message === "string" ? data.error.message : "OpenAI blog request failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const output = extractOutputText(data);
    if (!output) {
      return NextResponse.json({ error: "OpenAI returned an empty blog package." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Blog generator request failed." },
      { status: 500 }
    );
  }
}
