import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SuggestInput = {
  page_key?: unknown;
  section_key?: unknown;
  label?: unknown;
  content?: unknown;
  content_type?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

async function requireAdmin(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Missing admin session token.");
  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) throw new Error("Invalid admin session.");
  const { data: profile, error: profileError } = await supabase
    .from("app_profiles")
    .select("role, status")
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();
  if (profileError) throw new Error(`Admin role lookup failed: ${profileError.message}`);
  if (!profile || profile.role !== "admin" || profile.status !== "active") throw new Error("Admin role is required.");
  return true;
}

function fallbackSuggestion(input: Required<SuggestInput>) {
  const page = clean(input.page_key) || "page";
  const section = clean(input.section_key) || "section";
  const current = clean(input.content);
  const label = clean(input.label) || section;
  const type = clean(input.content_type) || "text";

  if (type === "meta_title") return `CowStop Concrete Cattle Guard Forms | Cattle Guard Forms`;
  if (type === "meta_description") return `Learn about CowStop reusable concrete cattle guard forms for ranch entrances, farm roads, contractors, distributors, freight planning, and durable livestock-control projects.`;
  if (type === "cta") return `Request Pricing`;
  if (section.includes("headline")) return `Reusable Concrete Cattle Guard Forms Built for Ranch, Farm, and Contractor Projects`;
  if (section.includes("body") || type === "textarea") {
    return `CowStop reusable concrete cattle guard forms help ranchers, contractors, concrete producers, and landowners pour durable cattle guard sections on site while reducing steel freight, lead-time, and repeat installation headaches.`;
  }

  return current
    ? `${current}\n\nSuggested improvement: make this section clearer, more customer-focused, and more search-friendly for ${page} / ${label}.`
    : `Add clear, customer-focused copy for ${page} / ${label} that explains the CowStop benefit, supports SEO, and guides visitors toward the next action.`;
}

async function openAiSuggestion(input: Required<SuggestInput>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const page = clean(input.page_key);
  const section = clean(input.section_key);
  const label = clean(input.label);
  const content = clean(input.content);
  const contentType = clean(input.content_type) || "text";

  const prompt = [
    "Write improved website copy for Cattle Guard Forms.",
    "Brand/product: CowStop reusable concrete cattle guard forms.",
    "Audience: ranchers, farmers, contractors, concrete companies, distributors, and landowners.",
    "Tone: practical, trustworthy, clear, sales-ready, SEO-aware, no hype.",
    "Do not mention AI, tests, sandbox, placeholder, or internal systems.",
    `Page: ${page}`,
    `Section: ${section}`,
    `Label: ${label}`,
    `Content type: ${contentType}`,
    `Current content: ${content || "empty"}`,
    "Return only the replacement text. No markdown. No explanation.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.CONTENT_AI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: contentType === "textarea" || section.includes("body") ? 220 : 80,
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return clean(payload.choices?.[0]?.message?.content);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as SuggestInput;
    const input = {
      page_key: clean(body.page_key),
      section_key: clean(body.section_key),
      label: clean(body.label),
      content: clean(body.content),
      content_type: clean(body.content_type) || "text",
    } as Required<SuggestInput>;

    if (!input.page_key) throw new Error("Page key is required.");
    if (!input.section_key) throw new Error("Section key is required.");

    const aiSuggestion = await openAiSuggestion(input);
    const suggestion = aiSuggestion || fallbackSuggestion(input);

    return NextResponse.json({ ok: true, suggestion, source: aiSuggestion ? "ai" : "fallback" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to generate content suggestion." }, { status: 400 });
  }
}
