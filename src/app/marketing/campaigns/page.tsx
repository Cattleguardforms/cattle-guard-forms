import Link from "next/link";
import { formatDate, getCrmCampaigns, type CrmCampaignRecord } from "@/lib/crm/records";

export const dynamic = "force-dynamic";

export default async function MarketingCampaignsPage() {
  let campaigns: CrmCampaignRecord[] = [];
  let count = 0;
  let errorMessage = "";

  try {
    const result = await getCrmCampaigns();
    campaigns = result.records;
    count = result.count;
  } catch (error) {
    campaigns = [];
    errorMessage = error instanceof Error ? error.message : "Unable to load CRM campaigns.";
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="text-sm font-semibold text-green-800 hover:text-green-950">← Marketing Portal</Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-neutral-700">
            <Link href="/marketing/contacts" className="hover:text-green-800">Contacts</Link>
            <Link href="/marketing/companies" className="hover:text-green-800">Companies</Link>
            <Link href="/marketing/email" className="hover:text-green-800">Email Composer</Link>
            <Link href="/marketing/ai" className="hover:text-green-800">AI Studio</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Supabase CRM</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Campaigns</h1>
              <p className="mt-3 max-w-3xl text-neutral-700">
                Supabase-backed marketing campaigns for promotions, distributor pushes, blog/content plans, and sales follow-up.
              </p>
            </div>
            <div className="rounded-xl bg-green-50 px-5 py-4 text-green-950 ring-1 ring-green-200">
              <p className="text-sm font-medium">Campaigns</p>
              <p className="text-3xl font-bold">{count}</p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            CRM connection error: {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-200">
              No campaigns found yet. Create campaigns after the marketing campaign table is populated.
            </div>
          ) : (
            campaigns.map((campaign) => (
              <article key={campaign.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-neutral-950">{campaign.name || "Untitled campaign"}</h2>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">{campaign.status || "planning"}</span>
                </div>
                <p className="mt-3 min-h-16 text-sm leading-6 text-neutral-700">{campaign.goal || "No campaign goal added yet."}</p>
                <dl className="mt-5 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-neutral-950">Start</dt>
                    <dd>{formatDate(campaign.start_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-950">End</dt>
                    <dd>{formatDate(campaign.end_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-950">Budget</dt>
                    <dd>{campaign.budget ? `$${Number(campaign.budget).toLocaleString()}` : "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-950">Created</dt>
                    <dd>{formatDate(campaign.created_at)}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
