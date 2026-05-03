import Link from "next/link";

const channels = [
  ["Google Ads", "/marketing/campaigns/google-ads", "Search, local intent, retargeting, conversion tracking, and sales attribution."],
  ["Facebook Marketplace", "/marketing/campaigns/facebook-marketplace", "Marketplace listing workflow, leads, follow-up, and distributor/customer handoff."],
  ["Facebook Ads", "/marketing/campaigns/facebook-ads", "Paid social campaigns, audience testing, creative, and lead capture."],
  ["TikTok", "/marketing/campaigns/tiktok", "Short-form video content, ad testing, and awareness campaigns."],
  ["LinkedIn", "/marketing/campaigns/linkedin", "Commercial, contractor, municipal, distributor, and B2B lead campaigns."],
  ["AI Content Studio", "/marketing/ai", "Generate campaign copy, ads, scripts, landing-page copy, and social content."],
  ["Email Campaigns", "/marketing/email", "Distributor pushes, customer follow-up, promotions, and nurture emails."],
];

export const dynamic = "force-dynamic";

export default function MarketingCampaignsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="text-sm font-semibold text-green-800 hover:text-green-950">Back to Marketing Portal</Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-neutral-700">
            <Link href="/marketing/contacts" className="hover:text-green-800">CRM Contacts</Link>
            <Link href="/marketing/sales-analytics" className="hover:text-green-800">Sales Analytics</Link>
            <Link href="/marketing/email" className="hover:text-green-800">Email Campaigns</Link>
            <Link href="/marketing/seo" className="hover:text-green-800">SEO Tester</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Campaign command center</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Campaigns</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                Connect and manage campaign channels that actually drive sales: Google Ads, Facebook Marketplace, Facebook Ads, TikTok, LinkedIn, AI content, and email campaigns.
              </p>
            </div>
            <div className="rounded-xl bg-green-50 px-5 py-4 text-green-950 ring-1 ring-green-200">
              <p className="text-sm font-medium">Channels</p>
              <p className="text-3xl font-bold">{channels.length}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {channels.map(([label, href, note]) => (
            <Link key={label} href={href} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
              <h2 className="text-xl font-bold text-neutral-950">{label}</h2>
              <p className="mt-3 min-h-16 text-sm leading-6 text-neutral-700">{note}</p>
              <span className="mt-5 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-bold text-white">Open</span>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-bold">How this should work</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-neutral-700">
            Each channel needs connection status, setup checklist, creative/copy workflow, spend tracking, lead tracking, and sales attribution. The next phase should wire each channel to real provider accounts or import workflows so marketing spend can be compared against orders sold.
          </p>
        </section>
      </section>
    </main>
  );
}
