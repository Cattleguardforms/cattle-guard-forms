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

const allowedSizes = new Set(["1024x1024", "1024x1536", "1536x1024"]);

function safeValue(value: unknown, fallback: string, maxLength = 1500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
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

  const platform = safeValue(body.platform, "General marketing");
  const imageType = safeValue(body.imageType, "Ad creative");
  const audience = safeValue(body.audience, "farmers, ranchers, land owners, contractors, concrete companies, and distributors");
  const tone = safeValue(body.tone, "professional, rugged, practical, clean");
  const offer = safeValue(body.offer, "CowStop reusable cattle guard forms");
  const goal = safeValue(body.goal, "generate qualified leads and product interest");
  const headline = safeValue(body.headline, "Build Better Cattle Guards", 200);
  const cta = safeValue(body.cta, "Request a quote", 200);
  const visualNotes = safeValue(body.visualNotes, "A realistic rural ranch entrance with a durable concrete cattle guard form, professional agricultural marketing style.");
  const size = allowedSizes.has(body.size ?? "") ? body.size : "1024x1024";

  const prompt = `Create a professional marketing image for Cattle Guard Forms.\n\nPlatform: ${platform}\nImage type: ${imageType}\nAudience: ${audience}\nTone/style: ${tone}\nProduct/offer: ${offer}\nGoal: ${goal}\nHeadline text to include if it looks natural: ${headline}\nCTA text to include if it looks natural: ${cta}\nVisual notes: ${visualNotes}\n\nImage requirements:\n- Make it look like a real agricultural/construction marketing asset.\n- Keep the image clean, professional, and sales-ready.\n- Avoid fake logos, fake phone numbers, fake websites, fake badges, and fake testimonials.\n- If text is included, keep it short and legible.\n- Focus on rural property, concrete cattle guard forms, practical durability, and distributor/customer value.`;

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
        quality: "medium",
        n: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "OpenAI image request failed." },
        { status: response.status },
      );
    }

    const image = data?.data?.[0];
    const imageUrl = image?.url ?? (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : "");

    if (!imageUrl) {
      return NextResponse.json({ error: "OpenAI returned no image." }, { status: 502 });
    }

    return NextResponse.json({
      imageUrl,
      prompt,
      caption: `${headline}\n\n${cta}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marketing image request failed." },
      { status: 500 },
    );
  }
}
