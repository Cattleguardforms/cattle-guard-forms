import Link from "next/link";
import { getCrmCompanies, type CrmCompanyRecord } from "@/lib/crm/records";

export const dynamic = "force-dynamic";

export default async function MarketingCompaniesPage() {
  let companies: CrmCompanyRecord[] = [];
  let errorMessage = "";

  try {
    companies = await getCrmCompanies();
  } catch (error) {
    companies = [];
    errorMessage = error instanceof Error ? error.message : "Unable to load CRM companies.";
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="text-sm font-semibold text-green-800 hover:text-green-950">← Marketing Portal</Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-neutral-700">
            <Link href="/marketing/contacts" className="hover:text-green-800">Contacts</Link>
            <Link href="/marketing/campaigns" className="hover:text-green-800">Campaigns</Link>
            <Link href="/marketing/distributor-accounts" className="hover:text-green-800">Distributor Accounts</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Supabase CRM</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">CRM Companies</h1>
              <p className="mt-3 max-w-3xl text-neutral-700">
                Company views grouped from customer records. This turns imported customer/contact data into a usable company CRM view.
              </p>
            </div>
            <div className="rounded-xl bg-green-50 px-5 py-4 text-green-950 ring-1 ring-green-200">
              <p className="text-sm font-medium">Companies</p>
              <p className="text-3xl font-bold">{companies.length}</p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            CRM connection error: {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-200">No companies found yet.</div>
          ) : (
            companies.map((company) => (
              <article key={company.name} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 hover:ring-green-800">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-neutral-950">{company.name}</h2>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-900 ring-1 ring-green-200">{company.count} contact{company.count === 1 ? "" : "s"}</span>
                </div>
                <dl className="mt-5 space-y-3 text-sm text-neutral-700">
                  <div>
                    <dt className="font-semibold text-neutral-950">Email</dt>
                    <dd>{company.primary_email || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-950">Phone</dt>
                    <dd>{company.primary_phone || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-950">Location</dt>
                    <dd>{[company.city, company.state].filter(Boolean).join(", ") || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-950">Status / Source</dt>
                    <dd>{company.status || company.source || "Not provided"}</dd>
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
