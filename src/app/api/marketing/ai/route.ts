import { NextRequest, NextResponse } from "next/server";

type MarketingAiRequest = {
  contentType?: string;
  channel?: string;
  audience?: string;
  tone?: string;
  offer?: string;
  goal?: string;
  notes?: string;
};

const allowedContentTypes = new Set([
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
]);

function safeValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 3000) : fallback;
}

function extractOutputText(data: any) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks: string[] = [];
  for (const item of data?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === "string") chunks.push(content.text);
    }
  }

  return chunks.join("\n").trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: MarketingAiRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const contentType = safeValue(body.contentType, "Facebook post");
  const normalizedContentType = allowedContentTypes.has(contentType) ? contentType : "Facebook post";
  const channel = safeValue(body.channel, "General marketing");
  const audience = safeValue(body.audience, "farmers, ranchers, land owners, contractors, and distributors");
  const tone = safeValue(body.tone, "clear, professional, confident, practical");
  const offer = safeValue(body.offer, "CowStop reusable cattle guard forms");
  const goal = safeValue(body.goal, "generate qualified interest and make the product easy to understand");
  const notes = safeValue(body.notes, "Focus on durability, reusable forms, installation efficiency, distributor value, and practical savings.");

  const prompt = `Create marketing content for Cattle Guard Forms.\n\nContent type: ${normalizedContentType}\nChannel: ${channel}\nAudience: ${audience}\nTone: ${tone}\nOffer/product: ${offer}\nGoal: ${goal}\nNotes/source details: ${notes}\n\nRules:\n- Write ready-to-use marketing copy.\n- Do not invent fake testimonials, fake guarantees, fake pricing, or fake statistics.\n- Keep claims practical and believable.\n- If pricing is mentioned, only use pricing supplied in the notes.\n- Include a clear call to action.\n- For social content, include a short caption plus suggested hashtags.\n- For email, include subject lines, preview text, body copy, and CTA.\n- For scripts, include hook, talking points, and closing CTA.\n- Output clean text that can be copied directly into the marketing portal.`;

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
          "You are a practical B2B marketing assistant for Cattle Guard Forms. You write concise, accurate, sales-ready copy for agricultural, ranch, construction, distributor, and concrete form audiences.",
        input: prompt,
        max_output_tokens: 1200,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "OpenAI request failed." },
        { status: response.status },
      );
    }

    const output = extractOutputText(data);

    if (!output) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marketing AI request failed." },
      { status: 500 },
    );
  }
}
