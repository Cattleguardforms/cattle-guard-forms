import Link from "next/link";
import { crmConfiguration } from "@/lib/crm/config";

const cards = [
  ["Leads", "0", "Incoming shop requests and quote leads."],
  ["CRM Contacts", "0", "Customers, distributors, vendors, and partners."],
  ["Social Posts", "0", "Drafts, scheduled posts, and published campaigns."],
  ["Open Tasks", "0", "Follow-ups, content work, and fulfillment actions."],
];

const modules = [
  "Lead Inbox",
  "Custom CRM",
  "Social Media Hub",
  "Campaign Calendar",
  "Distributor Accounts",
  "Order Pipeline",
  "Uploaded Files",
  "Email Activity",
  "Marketing Content",
  "Automation Rules",
];

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
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Reusable marketing workspace</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Marketing Portal + Configurable CRM</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
            A reusable workspace for leads, contacts, distributor activity, social media planning, campaign management, uploaded files, email activity, CRM follow-up, and content operations.
          </p>
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
            Social OAuth, CRM persistence, live records, saved views, and campaign automation will be connected after Supabase tables and admin roles are in place.
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, note]) => (
            <article key={label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-sm text-neutral-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Marketing Modules</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {modules.map((module) => (
                <div key={module} className="rounded-xl border border-neutral-200 p-5">
                  <h3 className="font-semibold text-neutral-950">{module}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">Supabase wiring next.</p>
                </div>
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
              <article key={channel.key} className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-neutral-950">{channel.label}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">{channel.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{channel.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">CRM</p>
          <h2 className="mt-2 text-2xl font-semibold">Configurable CRM Layer</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            The CRM has reusable entity, field, pipeline, and social-channel configuration. Supabase will persist configuration and store real records next.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmConfiguration.entities.map((entity) => (
              <article key={entity.key} className="rounded-xl border border-neutral-200 p-5">
                <h3 className="font-semibold text-neutral-950">{entity.pluralLabel}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{entity.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entity.fields.slice(0, 6).map((field) => (
                    <span key={field.key} className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">{field.label}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
