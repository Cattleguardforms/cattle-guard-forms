import Link from "next/link";
import DistributorNav from "../../DistributorNav";

const packets = [
  ["Warranty Packet", "/warranty", "Blank warranty and support record sheet."],
  ["Materials Packet", "/distributor/documents/materials", "CowStop materials, pallet dimensions, weights, and setup checklist."],
  ["Installation Guide Packet", "/distributor/documents/installation-guide", "Installation steps, handling notes, and support guidance."],
  ["Engineering Certificate Packet", "/distributor/documents/engineering-certificate", "HS-20 engineering reference information."],
];

export const metadata = { title: "Approved Distributor Packet Set | Cattle Guard Forms" };

export default function ApprovedPacketSetPage() {
  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950 print:bg-white"><section className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 print:shadow-none print:ring-0"><Link href="/distributor/documents" className="text-sm font-semibold text-green-800 print:hidden">Back to Documents</Link><p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Cattle Guard Forms</p><h1 className="mt-2 text-3xl font-black">Approved Distributor Packet Set</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">This packet set gives distributors one place to access CowStop warranty, materials, installation, and engineering documents. Use the order-specific warranty link from Distributor Home when customer information should be prefilled for an order.</p><div className="print:hidden"><DistributorNav active="documents" /></div><div className="mt-8 grid gap-4 md:grid-cols-2">{packets.map(([title, href, description]) => <Link key={href} href={href} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 hover:border-green-700 hover:bg-green-50"><h2 className="text-xl font-black text-green-950">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-700">{description}</p><span className="mt-4 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-bold text-white">Open</span></Link>)}</div><section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-bold">Distributor instruction</p><p className="mt-2">When an order is created, use that order's Warranty Paperwork link so customer name, phone, email, order number, and distributor information stay tied to the order record.</p></section></section></main>;
}
