import Link from "next/link";
import { crmConfiguration } from "@/lib/crm/config";

const cards = [
  ["AI Marketing", "ChatGPT", "Generate social posts, emails, scripts, ads, and campaigns.", "/marketing/ai"],
  ["Leads", "0", "Incoming shop requests and quote leads.", "/marketing/lead-inbox"],
  ["CRM Contacts", "0", "Customers, distributors, vendors, and partners.", "/marketing/contacts"],
  ["Social Posts", "0", "Drafts, scheduled posts, and published campaigns.", "/marketing/social-media-hub"],
];

const modules = [
  ["AI Marketing Generator", "/marketing/ai"],
  ["Lead Inbox", "/marketing/lead-inbox"],
  ["Custom CRM", "/marketing/custom-crm"],
  ["Social Media Hub", "/marketing/social-media-hub"],
  ["Campaign Calendar", "/marketing/campaign-calendar"],
  ["Distributor Accounts", "/marketing/distributor-accounts"],
  ["Order Pipeline", "/marketing/order-pipeline"],
  ["Uploaded Files", "/marketing/uploaded-files"],
  ["Email Activity", "/marketing/email-activity"],
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
            <Link href="/admin" className="hover:text-green-800">Admin Portal</Link>
            <Link href="/marketing" className="text-green-800">Marketing Portal</Link>
            <Link href="/marketing/ai" className="hover:text-green-800">AI Marketing</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Reusable marketing workspace</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Marketing Portal + ChatGPT Content Generator</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                A reusable workspace for leads, contacts, distributor activity, social media planning, campaign management, uploaded files, email activity, CRM follow-up, and AI-generated marketing content.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/marketing/ai" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
                Generate Marketing
              </Link>
              <Link href="/admin/crm-import" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">
                CRM Import
              </Link>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-900 ring-1 ring-green-200">
            Marketing and CRM module pages are live. The AI Marketing Generator uses a server-side API route and requires OPENAI_API_KEY in the deployment environment.
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
            <h2 className="text-2xl font-semibold">Marketing Modules</h2>
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
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Social media</p>
          <h2 className="mt-2 text-2xl font-semibold">Social Media Configuration</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Start with account registry, campaign planning, drafts, media assets, and manual posting. True auto-posting comes later after platform OAuth/API approvals are ready.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmConfiguration.socialChannels.map((channel) => (
              <Link key={channel.key} href={`/marketing/${channel.key}`} className="rounded-xl border border-neutral-200 p-5 hover:border-green-800 hover:bg-green-50">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-neutral-950">{channel.label}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">{channel.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{channel.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">CRM</p>
          <h2 className="mt-2 text-2xl font-semibold">Configurable CRM Layer</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            The CRM has reusable entity, field, pipeline, and social-channel configuration. Click any CRM entity below to create and manage records.
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
