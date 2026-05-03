"use client";

import { useEffect } from "react";

function getOrCreateId(key: string) {
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return "unavailable";
  }
}

export default function SiteAnalyticsTracker() {
  useEffect(() => {
    const track = async () => {
      try {
        const url = new URL(window.location.href);
        const visitorId = getOrCreateId("cgf_analytics_visitor_id");
        let sessionId = window.sessionStorage.getItem("cgf_analytics_session_id");
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          window.sessionStorage.setItem("cgf_analytics_session_id", sessionId);
        }

        await fetch("/api/site-analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            eventType: "page_view",
            pagePath: `${url.pathname}${url.search}`,
            pageTitle: document.title,
            referrer: document.referrer || "",
            visitorId,
            sessionId,
            utmSource: url.searchParams.get("utm_source") || "",
            utmMedium: url.searchParams.get("utm_medium") || "",
            utmCampaign: url.searchParams.get("utm_campaign") || "",
            gclid: url.searchParams.get("gclid") || "",
            fbclid: url.searchParams.get("fbclid") || "",
            ttclid: url.searchParams.get("ttclid") || "",
            liFatId: url.searchParams.get("li_fat_id") || "",
          }),
        });
      } catch {
        // Analytics must never break the public website.
      }
    };

    void track();
  }, []);

  return null;
}
