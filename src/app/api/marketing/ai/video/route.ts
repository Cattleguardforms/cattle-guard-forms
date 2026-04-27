import { NextRequest, NextResponse } from "next/server";

type MarketingVideoRequest = {
  platform?: string;
  videoType?: string;
  duration?: string;
  audience?: string;
  tone?: string;
  offer?: string;
  goal?: string;
  cta?: string;
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

function safeValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 3000) : fallback;
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
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: MarketingVideoRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const platform = safeValue(body.platform, "TikTok / Reels / Shorts");
  const videoType = safeValue(body.videoType, "Short-form product ad");
  const duration = safeValue(body.duration, "30 seconds");
  const audience = safeValue(body.audience, "farmers, ranchers, land owners, contractors, concrete companies, and distributors");
  const tone = safeValue(body.tone, "clear, practical, confident, and sales-focused");
  const offer = safeValue(body.offer, "CowStop reusable cattle guard forms");
  const goal = safeValue(body.goal, "generate qualified leads and make the product easy to understand");
  const cta = safeValue(body.cta, "Request a quote");
  const notes = safeValue(body.notes, "Focus on reusable forms, concrete cattle guard installation, practical savings, and distributor opportunity. Do not invent fake stats.");

  const prompt = `Create a complete video plan for Cattle Guard Forms.\n\nPlatform: ${platform}\nVideo type: ${videoType}\nDuration: ${duration}\nAudience: ${audience}\nTone: ${tone}\nProduct/offer: ${offer}\nGoal: ${goal}\nCTA: ${cta}\nNotes/source details: ${notes}\n\nOutput format:\n1. Video title\n2. Hook\n3. Scene-by-scene storyboard with scene number, visual, voiceover, on-screen text, and estimated seconds\n4. Full voiceover script\n5. Shot list / B-roll list\n6. Caption\n7. Hashtags\n8. Thumbnail image prompt\n9. Final CTA\n\nRules:\n- Do not claim fake statistics, fake testimonials, fake awards, or fake guarantees.\n- Keep it practical for ranch, farm, concrete, and distributor audiences.\n- Make it ready for a marketer to shoot or convert into a generated video later.`;

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
          "You are a practical video marketing strategist for Cattle Guard Forms. You create ready-to-use short-form and long-form video plans for agricultural, ranch, construction, distributor, and concrete form audiences.",
        input: prompt,
        max_output_tokens: 1600,
      }),
    });

    const data = (await response.json()) as OpenAiResponsePayload;

    if (!response.ok) {
      const message = typeof data.error?.message === "string" ? data.error.message : "OpenAI video planning request failed.";
      return NextResponse.json(
        { error: message },
        { status: response.status },
      );
    }

    const output = extractOutputText(data);

    if (!output) {
      return NextResponse.json({ error: "OpenAI returned an empty video plan." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marketing video request failed." },
      { status: 500 },
    );
  }
}
