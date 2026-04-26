import Link from "next/link";
import MarketingSectionClient from "./[section]/MarketingSectionClient";

const liveMarketingModules: Record<string, { title: string; description: string }> = {
  "lead-inbox": {
    title: "Lead Inbox",
    description: "Capture incoming shop requests, quote leads, distributor inquiries, and follow-up opportunities.",
  },
  "custom-crm": {
    title: "Custom CRM",
    description: "Create general CRM records for customers, vendors, partners, follow-ups, and business relationships.",
  },
  "social-media-hub": {
    title: "Social Media Hub",
    description: "Plan and track social accounts, draft posts, media ideas, and manual publishing status.",
  },
  "campaign-calendar": {
    title: "Campaign Calendar",
    description: "Create and schedule campaigns for product education, distributor recruiting, seasonal pushes, and promotions.",
  },
  "distributor-accounts": {
    title: "Distributor Accounts",
    description: "Manage distributor account records, pricing, status, territory, and notes.",
  },
  "order-pipeline": {
    title: "Order Pipeline",
    description: "Track order stages from draft through payment, shipping, manufacturer handoff, and completion.",
  },
  "uploaded-files": {
    title: "Uploaded Files",
    description: "Catalog uploaded files, historical CSVs, customer files, media assets, and import documents.",
  },
  "email-activity": {
    title: "Email Activity",
    description: "Track email templates, outbound follow-ups, distributor messages, and customer communications.",
  },
  "marketing-content": {
    title: "Marketing Content",
    description: "Create marketing ideas, page copy, ad concepts, sales materials, and educational content.",
  },
  "automation-rules": {
    title: "Automation Rules",
    description: "Define manual and future automated rules for lead routing, follow-ups, imports, and campaign actions.",
  },
  contacts: {
    title: "Contacts",
    description: "Manage people tied to customers, distributors, manufacturers, vendors, partners, and prospects.",
  },
  companies: {
    title: "Companies",
    description: "Manage ranches, farms, distributors, contractors, manufacturers, and vendors.",
  },
  opportunities: {
    title: "Opportunities",
    description: "Track quotes, distributor deals, bulk purchases, and follow-up revenue opportunities.",
  },
  orders: {
    title: "Orders",
    description: "Track retail and distributor orders from request through payment, fulfillment, shipping, and completion.",
  },
  "marketing-posts": {
    title: "Marketing Posts",
    description: "Create social posts, email content, campaign drafts, and scheduled marketing content.",
  },
  campaigns: {
    title: "Campaigns",
    description: "Manage reusable campaign containers for education, distributor recruiting, promotions, and content pushes.",
  },
};

function formatSectionTitle(section: string) {
  return section
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MarketingModuleShell({ section }: { section: string }) {
  const config = liveMarketingModules[section] ?? {
    title: formatSectionTitle(section) || "Marketing Module",
    description: "This marketing module is active. Full persistence and deeper workflow wiring can be added in the next backend hardening pass.",
  };
  const isConfiguredModule = Boolean(liveMarketingModules[section]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="font-semibold text-green-800">Marketing Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Home</Link>
            <Link href="/marketing/ai" className="hover:text-green-800">AI Marketing</Link>
            <Link href="/admin" className="hover:text-green-800">Admin Portal</Link>
            <Link href="/admin/crm-import" className="hover:text-green-800">CRM Import</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Marketing Portal</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{config.title}</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/marketing" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Back to Marketing</Link>
            <Link href="/marketing/ai" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Generate with AI</Link>
            <Link href="/admin/crm-import" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">CRM Import</Link>
          </div>
        </div>

        {isConfiguredModule ? (
          <MarketingSectionClient section={section} />
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Module active</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">This marketing module has not been fully configured yet, but this route is live and no longer returns a 404.</p>
          </div>
        )}
      </section>
    </main>
  );
}
