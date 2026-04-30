import Link from "next/link";
import DistributorNav from "../../DistributorNav";

const materials = [
  ["CowStop reusable form", "1 form", "Reusable HDPE form; patent pending."],
  ["Concrete release agent", "Pam or approved concrete release agent", "Apply before pour."],
  ["Concrete mix", "12 bags - 80 lb each", "Use 4000 PSI concrete mix."],
  ["1/2 inch rebar", "4 pieces at 70 3/4 inches", "Long reinforcement bars."],
  ["1/2 inch rebar", "4 pieces at 68 3/4 inches", "Long reinforcement bars."],
  ["J-bolts", "2 pieces - 10 inch J-bolts", "Place in foam holes as shown."],
  ["Tomato stakes", "2 pieces - 17 inch tomato stakes", "Used as shown in setup."],
  ["Ties / zip ties", "As needed", "Secure reinforcement and placement components."],
];

const pallets = [["1", "72 x 48 x 20 in", "105 lb"], ["2", "72 x 48 x 20 in", "190 lb"], ["3", "72 x 48 x 36 in", "270 lb"], ["4", "72 x 48 x 36 in", "355 lb"], ["5", "72 x 48 x 52 in", "440 lb"], ["6", "72 x 48 x 52 in", "525 lb"]];

export const metadata = { title: "CowStop Materials Packet | Cattle Guard Forms" };

export default function MaterialsDocumentPage() {
  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950 print:bg-white"><section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 print:shadow-none print:ring-0"><Link href="/distributor/documents" className="text-sm font-semibold text-green-800 print:hidden">Back to Documents</Link><p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Cattle Guard Forms</p><h1 className="mt-2 text-3xl font-black">CowStop Materials Packet</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">Customer-facing material list and setup reference for one CowStop reusable cattle guard form installation.</p><div className="print:hidden"><DistributorNav active="documents" /></div><section className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5"><h2 className="text-xl font-black text-green-950">Material List</h2><div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-green-800 text-white"><tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Quantity / Specification</th><th className="px-3 py-2">Notes</th></tr></thead><tbody className="divide-y divide-neutral-200">{materials.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="px-3 py-2 align-top">{cell}</td>)}</tr>)}</tbody></table></div></section><section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="text-xl font-black text-green-950">Pallet Count, Dimensions, and Weight</h2><p className="mt-2 text-sm leading-6 text-neutral-700">Maximum six CowStops per pallet.</p><div className="mt-4 overflow-hidden rounded-xl border border-neutral-200"><table className="w-full text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Dimensions</th><th className="px-3 py-2">Weight</th></tr></thead><tbody className="divide-y divide-neutral-200">{pallets.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div></section><section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-bold">Checklist</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>Confirm the CowStop form is clean and undamaged before use.</li><li>Apply concrete release agent before concrete is placed.</li><li>Confirm all rebar, J-bolts, stakes, and ties are available before mixing concrete.</li><li>Use 4000 PSI concrete mix.</li><li>Keep BOLs, delivery photos, and customer warranty information with the order record.</li></ul></section></section></main>;
}
