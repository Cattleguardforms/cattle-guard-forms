import Link from "next/link";
import { crmConfiguration } from "@/lib/crm/config";

const cards = [
  ["AI Marketing", "ChatGPT", "Generate social posts, emails, scripts, ads, and campaigns.", "/marketing/ai"],
  ["Email Composer", "AI + CRM", "Generate price increase emails and save activity to CRM.", "/marketing/email"],
  ["CRM Contacts", "Live", "View Supabase customer/contact records and call notes.", "/marketing/contacts"],
  ["Companies", "Live", "View grouped company/customer records from CRM data.", "/marketing/companies"],
];

const modules = [
  ["CRM Contacts", "/marketing/contacts"],
  ["CRM Companies", "/marketing/companies"],
  ["Campaigns", "/marketing/campaigns"],
  ["AI Content Studio", "/marketing/ai"],
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
            <Link href="/marketing/email" className="hover:text-green-800">Email Composer</Link>
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
                Manage real CRM contacts, companies, campaigns, distributor activity, social media planning, email generation, blog planning, uploaded files, and AI-generated marketing content.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/marketing/contacts" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
                Open CRM
              </Link>
              <Link href="/marketing/email" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">
                Write Email
              </Link>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">
            CRM Contacts and Companies now load from Supabase customer data. Local-only workspaces still exist for modules that do not yet have database tables.
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
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Email + CRM workflow</p>
          <h2 className="mt-2 text-2xl font-semibold">AI Email Composer</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Create price increase emails, distributor follow-ups, customer quote replies, and campaign emails. Saving an email activity creates or updates the recipient contact by email and records the email in CRM activity/order history.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/marketing/email" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">Write Email</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Generate and edit a CRM-connected email.</p>
            </Link>
            <Link href="/marketing/email-activity" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">Email Activity</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Track email records, campaigns, dates, and status.</p>
            </Link>
            <Link href="/marketing/contacts" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">CRM Contacts</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">View real Supabase contact records.</p>
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Blog + content workflow</p>
          <h2 className="mt-2 text-2xl font-semibold">Public Blog Connection</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Use the Blog Manager to plan article topics, AI Content Studio to generate drafts and images, Marketing Content to hold reusable copy, and the public Blog page to publish customer-facing education.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/marketing/blog" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">Blog Manager</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Plan posts, status, SEO title, category, and draft notes.</p>
            </Link>
            <Link href="/marketing/ai" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">AI Content Studio</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Generate blog copy, social images, and video outlines.</p>
            </Link>
            <Link href="/blog" className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
              <h3 className="font-semibold text-neutral-950">Public Blog</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">View the customer-facing blog page.</p>
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Social media</p>
          <h2 className="mt-2 text-2xl font-semibold">Social Media Platform Links</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Click Open Platform to go directly to the social network. Use Workspace to plan content inside the marketing portal.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmConfiguration.socialChannels.map((channel) => (
              <article key={channel.key} className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-neutral-950">{channel.label}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">{channel.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{channel.description}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={channel.platformUrl} target="_blank" rel="noreferrer" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">
                    Open Platform
                  </a>
                  <Link href={channel.workspaceUrl} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-green-800 hover:bg-white">
                    Workspace
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">CRM</p>
          <h2 className="mt-2 text-2xl font-semibold">CRM Layer</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Contacts, Companies, and Campaigns now have dedicated Supabase-backed views. Other entities remain configurable workspaces until their database tables are fully wired.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmConfiguration.entities.map((entity) => (
              <Link key={entity.key} href={entityLinks[entity.key] ?? "/marketing/custom-crm"} className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
                <h3 className="font-semibold text-neutral-950">{entity.pluralLabel}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{entity.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entity.fields.slice(0, 6).map((field) => (
                    <span key={field.key} className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">{field.label}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
