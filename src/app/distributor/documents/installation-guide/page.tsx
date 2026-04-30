import Link from "next/link";
import DistributorNav from "../../DistributorNav";

const steps = [
  "Clean the CowStop form and apply concrete release agent before placing concrete.",
  "Place reinforcement according to the CowStop material list and installation photos.",
  "Place J-bolts in the foam holes and verify alignment before cure.",
  "Mix and place 4000 PSI concrete evenly without shifting reinforcement or J-bolts.",
  "Level and finish the concrete surface, then remove excess concrete from the form.",
  "Allow concrete to cure adequately before lifting, moving, or installing.",
  "Lift only from the approved J-bolt locations using two chains.",
  "Install according to the project plan and keep BOL, delivery photos, and warranty paperwork with the customer record.",
];

export const metadata = { title: "CowStop Installation Guide | Cattle Guard Forms" };

export default function InstallationGuidePage() {
  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950 print:bg-white"><section className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 print:shadow-none print:ring-0"><Link href="/distributor/documents" className="text-sm font-semibold text-green-800 print:hidden">Back to Documents</Link><p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Cattle Guard Forms</p><h1 className="mt-2 text-3xl font-black">CowStop Installation Guide Packet</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">Customer-facing installation guidelines for the CowStop reusable form. Confirm site conditions, drainage, local requirements, and safe lifting practices before installation.</p><div className="print:hidden"><DistributorNav active="documents" /></div><section className="mt-8 grid gap-4">{steps.map((step, index) => <div key={step} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-sm font-bold uppercase tracking-wide text-green-800">Step {index + 1}</p><p className="mt-2 text-sm leading-6 text-neutral-800">{step}</p></div>)}</section><section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-bold">Handling and warranty notes</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>Do not drag, crush, cut, drill, burn, or abuse the HDPE form.</li><li>Freight damage must be documented at delivery.</li><li>Warranty review is limited to manufacturer defects and requires photo documentation within 30 days.</li></ul></section></section></main>;
}
