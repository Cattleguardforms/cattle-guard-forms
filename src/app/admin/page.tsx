import Link from "next/link";

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

const pipeline = [
  "New lead received",
  "Reviewed by admin",
  "Customer or distributor contacted",
  "Payment confirmed",
  "Sent to manufacturer",
  "Ship date received",
  "Tracking sent",
  "Completed",
];

const socialChannels = [
  ["Facebook", "Not connected", "Page posts, ranch education, before/after photos, and distributor announcements."],
  ["Instagram", "Not connected", "Visual project posts, reels, installation steps, and product lifestyle content."],
  ["X / Twitter", "Not connected", "Short updates, product announcements, and industry commentary."],
  ["LinkedIn", "Not connected", "B2B distributor updates, wholesale news, and company credibility posts."],
  ["YouTube", "Not connected", "Installation videos, product walkthroughs, and customer education."],
  ["TikTok", "Planned", "Short-form ranch/install clips after the core system is stable."],
];

const contentStatuses = ["Idea", "Draft", "Needs Review", "Approved", "Scheduled", "Published", "Archived"];

const crmEntities = [
  ["Contacts", "People tied to customers, distributors, vendors, manufacturers, and partners."],
  ["Companies", "Organizations such as ranches, distributors, farms, contractors, and manufacturers."],
  ["Deals / Opportunities", "Potential orders, distributor deals, bulk purchases, and open quotes."],
  ["Pipelines", "Fully customizable sales, distributor, fulfillment, and marketing workflows."],
  ["Custom Fields", "Add fields per business: herd size, gate width, preferred freight, territory, source, priority, and more."],
  ["Activity Timeline", "Calls, emails, notes, status changes, uploads, and follow-up tasks in one history."],
];

const crmFieldTypes = [
  "Text",
  "Number",
  "Currency",
  "Date",
  "Dropdown",
  "Multi-select",
  "Checkbox",
  "File",
  "Email",
  "Phone",
  "URL",
  "Relationship",
];

const crmPipelines = [
  "Retail Lead Pipeline",
  "Distributor Recruiting Pipeline",
  "Distributor Order Pipeline",
  "Manufacturer Fulfillment Pipeline",
  "Marketing Campaign Pipeline",
];

export default function MarketingAdminPortalPage() {
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
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Marketing Portal + Custom CRM</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
            A reusable operating center for leads, contacts, distributor activity, social media planning, campaign management, order visibility, uploaded files, email activity, and fulfillment follow-up. The CRM is designed to be fully customizable so this same portal can be reused for other businesses later.
          </p>
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
            Admin authentication, live Supabase data, social OAuth connections, and real CRM persistence are not connected yet. This is the foundation screen for tomorrow's Supabase build.
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
            <h2 className="text-2xl font-semibold">Order Pipeline</h2>
            <ol className="mt-5 space-y-4">
              {pipeline.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">{index + 1}</span>
                  <span className="leading-7 text-neutral-700">{item}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Social media</p>
              <h2 className="mt-2 text-2xl font-semibold">Social Media Hub</h2>
              <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
                Start with account registry, campaign planning, content drafts, media assets, and manual posting workflows. True auto-posting should come later after each platform's OAuth/API approvals are set up.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200">OAuth later</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {socialChannels.map(([platform, status, description]) => (
              <article key={platform} className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-neutral-950">{platform}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">{status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
                <button className="mt-4 rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800" type="button">
                  Connect later
                </button>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
            <h3 className="font-semibold">Content Status Flow</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {contentStatuses.map((status) => (
                <span key={status} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200">{status}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-800">CRM</p>
              <h2 className="mt-2 text-2xl font-semibold">Fully Customizable CRM Foundation</h2>
              <p className="mt-3 max-w-4xl leading-7 text-neutral-700">
                This CRM should not be hard-coded only for cattle guards. It needs customizable entities, fields, statuses, pipelines, saved views, notes, activity history, ownership, file attachments, and automation rules so it can be reused for other businesses.
              </p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 ring-1 ring-green-200">Reusable core</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crmEntities.map(([entity, description]) => (
              <article key={entity} className="rounded-xl border border-neutral-200 p-5">
                <h3 className="font-semibold text-neutral-950">{entity}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
              <h3 className="font-semibold">Custom Field Types</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {crmFieldTypes.map((type) => (
                  <span key={type} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200">{type}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
              <h3 className="font-semibold">Starter Pipelines</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-neutral-700">
                {crmPipelines.map((item) => (
                  <li key={item}>• {item}</li>
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
