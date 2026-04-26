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

export default function MarketingAdminPortalPage() {
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
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/admin" className="text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Reusable marketing/admin slice</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Marketing Portal + Configurable CRM</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
            A reusable operating center for leads, contacts, distributor activity, social media planning, campaign management, order visibility, uploaded files, email activity, and fulfillment follow-up. The CRM configuration now lives in a reusable config layer so Supabase can persist entities, fields, pipelines, and social accounts next.
          </p>
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
            Admin authentication, live Supabase records, social OAuth connections, and real CRM persistence are not connected yet. The CRM schema/config foundation is now separated from the page UI.
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
            <h2 className="text-2xl font-semibold">Portal Modules</h2>
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Social media</p>
              <h2 className="mt-2 text-2xl font-semibold">Social Media Configuration</h2>
              <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
                Start with account registry, campaign planning, content drafts, media assets, and manual posting workflows. True auto-posting should come later after each platform's OAuth/API approvals are set up.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200">OAuth later</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmConfiguration.socialChannels.map((channel) => (
              <article key={channel.key} className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-neutral-950">{channel.label}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">{channel.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{channel.description}</p>
                <button className="mt-4 rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800" type="button">
                  Connect later
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-800">CRM</p>
              <h2 className="mt-2 text-2xl font-semibold">Real CRM Configuration Layer</h2>
              <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
                The CRM now has reusable entity, field, pipeline, and social-channel configuration. Tomorrow Supabase can persist this configuration and store real records against it.
              </p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 ring-1 ring-green-200">Config driven</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmConfiguration.entities.map((entity) => (
              <article key={entity.key} className="rounded-xl border border-neutral-200 p-5">
                <h3 className="font-semibold text-neutral-950">{entity.pluralLabel}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{entity.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Fields</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entity.fields.slice(0, 8).map((field) => (
                    <span key={field.key} className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                      {field.label}
                    </span>
                  ))}
                  {entity.fields.length > 8 ? (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                      +{entity.fields.length - 8} more
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
              <h3 className="font-semibold">Custom Field Types</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {crmConfiguration.fieldTypes.map((fieldType) => (
                  <span key={fieldType.type} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200">{fieldType.label}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
              <h3 className="font-semibold">Configured Pipelines</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-neutral-700">
                {crmConfiguration.pipelines.map((pipeline) => (
                  <li key={pipeline.key}>• {pipeline.label} — {pipeline.stages.length} stages</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Reusable Boundary</h2>
          <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
            Keep the core portal generic: leads, contacts, companies, opportunities, pipelines, custom fields, files, notes, content blocks, social accounts, campaigns, and email activity. Keep Cattle Guard Forms-specific logic separate: CowStop pricing, Echo freight, BOL uploads, distributor logos, and manufacturer fulfillment.
          </p>
        </section>
      </section>
    </main>
  );
}
