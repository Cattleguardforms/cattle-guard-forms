import { NextRequest, NextResponse } from "next/server";

type MarketingImageRequest = {
  platform?: string;
  imageType?: string;
  audience?: string;
  tone?: string;
  offer?: string;
  goal?: string;
  headline?: string;
  cta?: string;
  visualNotes?: string;
  size?: string;
};

type OpenAiImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message?: unknown;
  };
};

const allowedSizes = new Set(["1024x1024", "1024x1536", "1536x1024"]);

function safeValue(value: unknown, fallback: string, maxLength = 2000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function buildImagePrompt(payload: Required<MarketingImageRequest>) {
  return [
    "Create a realistic B2B marketing image for Cattle Guard Forms.",
    `Product/category: ${payload.offer}.`,
    `Image type: ${payload.imageType}.`,
    `Platform: ${payload.platform}.`,
    `Audience: ${payload.audience}.`,
    `Goal: ${payload.goal}.`,
    `Style/tone: ${payload.tone}.`,
    `Visual direction: ${payload.visualNotes}.`,
    "",
    "Critical product accuracy requirements:",
    "- The image must clearly relate to concrete cattle guard forms, cattle guard installation, ranch/farm entrances, rural driveways, reusable formwork, concrete pouring, or distributor/construction use.",
    "- Make the cattle guard/form context obvious. Do not create unrelated livestock portraits, generic farm scenery, random fences, or unrelated machinery.",
    "- Show practical rural construction context: concrete, formwork, ranch driveway, equipment tracks, gravel, cattle guard opening, or an installed cattle guard.",
    "- Avoid fake logos, fake websites, fake phone numbers, fake badges, fake testimonials, and distorted product markings.",
    "- Do not rely on generated image text. Leave clean negative space so the website/app can overlay headline and CTA separately.",
    `Suggested overlay headline, not embedded text: ${payload.headline}.`,
    `Suggested overlay CTA, not embedded text: ${payload.cta}.`,
    "- Professional, realistic, sales-ready agricultural/construction marketing look.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: MarketingImageRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const size = allowedSizes.has(body.size ?? "") ? body.size ?? "1024x1024" : "1024x1024";
  const payload: Required<MarketingImageRequest> = {
    platform: safeValue(body.platform, "Facebook"),
    imageType: safeValue(body.imageType, "Ad creative"),
    audience: safeValue(body.audience, "farmers, ranchers, land owners, contractors, concrete companies, and distributors"),
    tone: safeValue(body.tone, "professional, rugged, practical, clean"),
    offer: safeValue(body.offer, "CowStop reusable concrete cattle guard forms"),
    goal: safeValue(body.goal, "generate qualified leads and product interest"),
    headline: safeValue(body.headline, "Build Better Cattle Guards", 160),
    cta: safeValue(body.cta, "Request a quote", 80),
    visualNotes: safeValue(
      body.visualNotes,
      "A realistic rural ranch entrance with a concrete cattle guard form installation, visible concrete formwork and cattle guard context, clean space for ad text overlay."
    ),
    size,
  };

  const prompt = buildImagePrompt(payload);

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt,
        size,
        quality: process.env.OPENAI_IMAGE_QUALITY ?? "high",
        n: 1,
      }),
    });

    const data = (await response.json()) as OpenAiImageResponse;

    if (!response.ok) {
      const message = typeof data.error?.message === "string" ? data.error.message : "OpenAI image request failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const image = data.data?.[0];
    const imageUrl = image?.url ?? (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : "");

    if (!imageUrl) {
      return NextResponse.json({ error: "OpenAI returned no image." }, { status: 502 });
    }

    const caption = [
      payload.headline,
      "",
      `${payload.offer} for ${payload.audience}.`,
      `CTA: ${payload.cta}`,
      "",
      "Tip: For cleaner ads, overlay headline/CTA in the app or design tool instead of depending on generated image text.",
    ].join("\n");

    return NextResponse.json({
      imageUrl,
      prompt: image?.revised_prompt || prompt,
      caption,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marketing image request failed." },
      { status: 500 },
    );
  }
}
