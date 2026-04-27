import Link from "next/link";
import { formatContactName, formatDate, getCrmContacts, type CrmContactRecord } from "@/lib/crm/records";

export const dynamic = "force-dynamic";

export default async function MarketingContactsPage() {
  let contacts: CrmContactRecord[] = [];
  let count = 0;
  let errorMessage = "";

  try {
    const result = await getCrmContacts();
    contacts = result.records;
    count = result.count;
  } catch (error) {
    contacts = [];
    errorMessage = error instanceof Error ? error.message : "Unable to load CRM contacts.";
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="text-sm font-semibold text-green-800 hover:text-green-950">← Marketing Portal</Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-neutral-700">
            <Link href="/marketing/companies" className="hover:text-green-800">Companies</Link>
            <Link href="/marketing/campaigns" className="hover:text-green-800">Campaigns</Link>
            <Link href="/marketing/email" className="hover:text-green-800">Email Composer</Link>
            <Link href="/admin" className="hover:text-green-800">Admin</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Supabase CRM</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">CRM Contacts</h1>
              <p className="mt-3 max-w-3xl text-neutral-700">
                Real customer/contact records loaded from the Supabase customers table. Use this for phone calls, follow-ups, notes, and customer context.
              </p>
            </div>
            <div className="rounded-xl bg-green-50 px-5 py-4 text-green-950 ring-1 ring-green-200">
              <p className="text-sm font-medium">Total contacts</p>
              <p className="text-3xl font-bold">{count}</p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            CRM connection error: {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="grid grid-cols-12 border-b border-neutral-200 bg-neutral-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            <span className="col-span-3">Contact</span>
            <span className="col-span-3">Company</span>
            <span className="col-span-2">Phone</span>
            <span className="col-span-2">Location</span>
            <span className="col-span-2">Updated</span>
          </div>
          {contacts.length === 0 ? (
            <div className="p-8 text-sm text-neutral-600">No contacts found yet.</div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="grid grid-cols-12 gap-3 border-b border-neutral-100 px-4 py-4 text-sm last:border-b-0 hover:bg-green-50/50">
                <div className="col-span-3">
                  <p className="font-semibold text-neutral-950">{formatContactName(contact)}</p>
                  <p className="mt-1 text-neutral-600">{contact.email || "No email"}</p>
                </div>
                <div className="col-span-3">
                  <p>{contact.company || "Unassigned"}</p>
                  <p className="mt-1 text-xs text-neutral-500">{contact.source || contact.status || "No source/status"}</p>
                </div>
                <div className="col-span-2">{contact.phone || contact.company_phone || "No phone"}</div>
                <div className="col-span-2">{[contact.city, contact.state].filter(Boolean).join(", ") || "No location"}</div>
                <div className="col-span-2">{formatDate(contact.updated_at || contact.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
