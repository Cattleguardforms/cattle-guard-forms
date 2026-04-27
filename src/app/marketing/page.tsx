import Link from "next/link";
import { crmConfiguration } from "@/lib/crm/config";

const cards = [
  ["AI Marketing", "ChatGPT", "Generate social posts, emails, scripts, ads, and campaigns.", "/marketing/ai"],
  ["SEO Tester", "Crawler", "Rank site pages and find SEO fixes.", "/marketing/seo"],
  ["Email Composer", "AI + CRM", "Generate price increase emails and save activity to CRM.", "/marketing/email"],
  ["CRM Contacts", "Live", "View Supabase customer/contact records and call notes.", "/marketing/contacts"],
];

const modules = [
  ["CRM Contacts", "/marketing/contacts"],
  ["CRM Companies", "/marketing/companies"],
  ["Campaigns", "/marketing/campaigns"],
  ["AI Content Studio", "/marketing/ai"],
  ["SEO Tester", "/marketing/seo"],
  ["Email Composer", "/marketing/email"],
  ["Email Activity", "/marketing/email-activity"],
  ["Blog Manager", "/marketing/blog"],
  ["Lead Inbox", "/marketing/lead-inbox"],
  ["Custom CRM", "/marketing/custom-crm"],
  ["Social Media Hub", "/marketing/social-media-hub"],
  ["Campaign Calendar", "/marketing/campaign-calendar"],
  ["Distributor Accounts", "/marketing/distributor-accounts"],
  ["Order Pipeline", "/marketing/order-pipeline"],
  ["Uploaded Files", "/marketing/uploaded-files"],
  ["Marketing Content", "/marketing/marketing-content"],
  ["Automation Rules", "/marketing/automation-rules"],
];

const entityLinks: Record<string, string> = {
  contacts: "/marketing/contacts",
  companies: "/marketing/companies",
  opportunities: "/marketing/opportunities",
  orders: "/marketing/orders",
  marketing_posts: "/marketing/marketing-posts",
  campaigns: "/marketing/campaigns",
};

export default function MarketingPortalPage() {
  const distributorOrderPipeline = crmConfiguration.pipelines.find(
    (pipeline) => pipeline.key === "distributor_orders",
  );

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
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
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Marketing and CRM workspace</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Marketing Portal + CRM</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                Manage real CRM contacts, companies, campaigns, distributor activity, social media planning, email generation, blog publishing, SEO testing, uploaded files, and AI-generated marketing content.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/marketing/contacts" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
                Open CRM
              </Link>
              <Link href="/marketing/seo" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">
                Run SEO Test
              </Link>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">
            CRM Contacts and Companies now load from Supabase customer data. Blog publishing and SEO testing are being wired into Supabase-backed marketing workflows.
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, note, href]) => (
            <Link key={label} href={href} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Marketing + CRM Modules</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {modules.map(([module, href]) => (
                <Link key={module} href={href} className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
                  <h3 className="font-semibold text-neutral-950">{module}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">Open workspace</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Distributor Order Pipeline</h2>
            <ol className="mt-5 space-y-4">
              {(distributorOrderPipeline?.stages ?? []).map((stage, index) => (
                <li key={stage.key} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">{index + 1}</span>
                  <span>
                    <span className="block font-medium text-neutral-950">{stage.label}</span>
                    <span className="block text-sm leading-6 text-neutral-600">{stage.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">SEO + blog workflow</p>
          <h2 className="mt-2 text-2xl font-semibold">SEO Tester and Blog Publishing</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Generate SEO blog packages, save drafts to the website, publish posts, crawl the site, rank SEO performance, and prioritize page fixes.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/marketing/seo" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">SEO Tester</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Run page audits and sitewide SEO rankings.</p>
            </Link>
            <Link href="/marketing/blog" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">Blog Manager</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Save drafts, publish posts, and manage website blog content.</p>
            </Link>
            <Link href="/marketing/ai" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">AI Content Studio</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Generate blog, image, video, social, and email content.</p>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
