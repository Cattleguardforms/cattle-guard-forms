import Link from "next/link";
import DistributorNav from "../DistributorNav";

export const metadata = {
  title: "Distributor Support | Cattle Guard Forms",
  description: "Distributor support room for CowStop order, warranty, freight, and installation issues.",
};

const supportTypes = [
  "Order question",
  "Warranty claim",
  "Freight damage",
  "Missing paperwork",
  "Installation question",
  "Payment or checkout issue",
];

export default function DistributorSupportPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <Link href="/distributor/home" className="text-sm font-semibold text-green-800">Back to Distributor Portal Home</Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p>
        <h1 className="mt-2 text-3xl font-black">Support</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">
          Use this room for distributor support, order questions, warranty issues, freight damage, installation help, and missing paperwork. A database-backed ticket system can be added next; this page prevents dead support links today.
        </p>
        <DistributorNav active="support" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-xl font-black text-green-950">Support categories</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-neutral-700">
                {supportTypes.map((type) => <li key={type}>• {type}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <p className="font-bold">Warranty claim reminder</p>
              <p className="mt-2">Warranty review is limited to manufacturer defects. Photos are required before review, and claims must be approved by Cattle Guard Forms before any return is accepted.</p>
            </div>
          </aside>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="text-xl font-black text-green-950">Open a support request</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Until the support-ticket backend is connected, contact Cattle Guard Forms support and include the information below.
            </p>
            <div className="mt-5 grid gap-4 text-sm">
              <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200"><span className="font-bold">Distributor name:</span> your company name</div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200"><span className="font-bold">Order number:</span> if available</div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200"><span className="font-bold">Issue type:</span> order, warranty, freight, installation, payment, or paperwork</div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200"><span className="font-bold">Photos/documents:</span> include damage photos, BOL, delivery photos, or installation photos when relevant</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/contact?topic=Distributor%20Support" className="rounded bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900">Contact support</Link>
              <Link href="/warranty" className="rounded border border-green-800 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">View warranty packet</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
