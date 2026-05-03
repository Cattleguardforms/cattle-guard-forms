import Link from "next/link";

const cards = [
  ["CRM Contacts", "Customers + leads", "People and companies live in one contact CRM view.", "/marketing/contacts"],
  ["Sales Analytics", "Revenue", "Track what sold, who sold it, and where sales came from.", "/marketing/sales-analytics"],
  ["Campaigns", "Ads + social", "Google Ads, Facebook Marketplace, Facebook, TikTok, and AI campaign content.", "/marketing/campaigns"],
  ["SEO + Blog", "Search", "SEO tester plus AI-assisted blog/content management.", "/marketing/seo"],
];

const modules = [
  ["CRM Contacts", "/marketing/contacts", "Customers, companies, distributors, and people in one CRM list."],
  ["Sales Analytics", "/marketing/sales-analytics", "Monthly sales, source attribution, distributor performance, and marketing-dollar comparison."],
  ["Campaigns", "/marketing/campaigns", "Google Ads, Facebook Marketplace, Facebook, TikTok, and campaign planning."],
  ["Email Campaigns", "/marketing/email", "Campaign email builder for promotions, distributor pushes, and customer follow-up."],
  ["SEO Tester", "/marketing/seo", "Run SEO audits and prioritize search fixes."],
  ["AI Blog Management", "/marketing/blog", "Plan, generate, refine, and publish blog/content assets."],
];

const campaignLinks = [
  ["Google Ads", "/marketing/campaigns#google-ads"],
  ["Facebook Marketplace", "/marketing/campaigns#facebook-marketplace"],
  ["Facebook Ads", "/marketing/campaigns#facebook-ads"],
  ["TikTok", "/marketing/campaigns#tiktok"],
  ["AI Content Studio", "/marketing/ai"],
  ["Email Campaigns", "/marketing/email"],
];

export default function MarketingPortalPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm font-medium text-neutral-700">
            <Link href="/portals" className="hover:text-green-800">Portal Access</Link>
            <Link href="/admin" className="hover:text-green-800">Admin Portal</Link>
            <Link href="/distributor" className="hover:text-green-800">Distributor Portal</Link>
            <Link href="/manufacturer" className="hover:text-green-800">Manufacturer Portal</Link>
            <Link href="/marketing" className="text-green-800">Marketing Portal</Link>
            <Link href="/marketing/seo" className="hover:text-green-800">SEO Tester</Link>
            <Link href="/blog" className="hover:text-green-800">Public Blog</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Marketing command center</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Marketing Portal</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                Focused tools for CRM contacts, sales analytics, ad campaigns, email campaigns, SEO testing, and AI-assisted blog/content management.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/marketing/contacts" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Open CRM Contacts</Link>
              <Link href="/marketing/campaigns" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">Open Campaigns</Link>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">
            CRM companies are no longer a separate workspace. Companies and individual people should be handled inside CRM Contacts, with sales and campaign attribution handled in Sales Analytics.
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, note, href]) => (
            <Link key={label} href={href} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Core Marketing Modules</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {modules.map(([module, href, note]) => (
                <Link key={module} href={href} className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
                  <h3 className="font-semibold text-neutral-950">{module}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{note}</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Campaign Channels</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">Campaigns should be organized by real sales channels, not random content tools.</p>
            <div className="mt-5 grid gap-3">
              {campaignLinks.map(([label, href]) => (
                <Link key={label} href={href} className="rounded-xl border border-neutral-200 p-4 font-semibold hover:border-green-800 hover:bg-green-50">{label}</Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">SEO + blog workflow</p>
          <h2 className="mt-2 text-2xl font-semibold">SEO Tester and AI Blog Management</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">SEO stays as its own tester. Blog/content should be one refined AI blog-management workflow, not scattered across several half-built modules.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link href="/marketing/seo" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50"><h3 className="font-semibold text-neutral-950">SEO Tester</h3><p className="mt-3 text-sm leading-6 text-neutral-600">Run page audits and sitewide SEO rankings.</p></Link>
            <Link href="/marketing/blog" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50"><h3 className="font-semibold text-neutral-950">AI Blog Management</h3><p className="mt-3 text-sm leading-6 text-neutral-600">Plan, generate, refine, and manage blog/content assets.</p></Link>
          </div>
        </section>
      </section>
    </main>
  );
}
