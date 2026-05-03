import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type TrackBody = Record<string, unknown>;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function channelFrom(input: { utmSource: string; utmMedium: string; referrer: string; gclid: string; fbclid: string; ttclid: string; liFatId: string }) {
  const source = input.utmSource.toLowerCase();
  const medium = input.utmMedium.toLowerCase();
  const referrer = input.referrer.toLowerCase();

  if (input.gclid || source.includes("google") && ["cpc", "paid", "ppc"].some((item) => medium.includes(item))) return "paid_campaign";
  if (input.fbclid || input.ttclid || input.liFatId || ["facebook", "instagram", "tiktok", "linkedin"].some((item) => source.includes(item))) return medium.includes("paid") || medium.includes("cpc") ? "paid_campaign" : "social";
  if (source.includes("distributor") || referrer.includes("distributor")) return "distributor_referral";
  if (["google", "bing", "yahoo", "duckduckgo"].some((item) => referrer.includes(item)) && !input.gclid) return "organic_search";
  if (referrer) return "referral";
  return "direct";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TrackBody;
    const utmSource = clean(body.utmSource);
    const utmMedium = clean(body.utmMedium);
    const referrer = clean(body.referrer);
    const gclid = clean(body.gclid);
    const fbclid = clean(body.fbclid);
    const ttclid = clean(body.ttclid);
    const liFatId = clean(body.liFatId);
    const channel = channelFrom({ utmSource, utmMedium, referrer, gclid, fbclid, ttclid, liFatId });

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("site_analytics_events").insert({
      event_type: clean(body.eventType) || "page_view",
      page_path: clean(body.pagePath) || "/",
      page_title: clean(body.pageTitle),
      referrer,
      visitor_id: clean(body.visitorId),
      session_id: clean(body.sessionId),
      channel,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: clean(body.utmCampaign),
      gclid,
      fbclid,
      ttclid,
      li_fat_id: liFatId,
      user_agent: request.headers.get("user-agent") || "",
      ip_hash: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "",
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to track analytics event." }, { status: 200 });
  }
}
