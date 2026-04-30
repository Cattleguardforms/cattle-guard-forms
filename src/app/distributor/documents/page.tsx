import Link from "next/link";
import DistributorNav from "../DistributorNav";

const documents = [
  {
    title: "Warranty Packet",
    href: "/warranty",
    description: "Customer warranty and support record sheet with limited warranty claim requirements.",
  },
  {
    title: "Materials Packet",
    href: "/distributor/documents/materials",
    description: "CowStop material list, pallet notes, weights, dimensions, and setup checklist.",
  },
  {
    title: "Installation Guide Packet",
    href: "/distributor/documents/installation-guide",
    description: "Customer-facing installation guide with preparation, pour, curing, lifting, and placement steps.",
  },
  {
    title: "Engineering Certificate Packet",
    href: "/distributor/documents/engineering-certificate",
    description: "HS-20 engineering certificate packet for CowStop reference documentation.",
  },
  {
    title: "Approved Distributor Packet Set",
    href: "/distributor/documents/approved-packet-set",
    description: "Combined distributor packet containing warranty, materials, installation, and engineering documents.",
  },
];

export const metadata = {
  title: "Distributor Documents | Cattle Guard Forms",
  description: "Distributor document room for CowStop warranty, materials, installation, and engineering packets.",
};

export default function DistributorDocumentsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <Link href="/distributor/home" className="text-sm font-semibold text-green-800">Back to Distributor Portal Home</Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p>
        <h1 className="mt-2 text-3xl font-black">Documents</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">
          Access approved CowStop paperwork for distributors and customers. These documents should be used for warranty records, material planning, installation support, and engineering reference.
        </p>
        <DistributorNav active="documents" />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {documents.map((doc) => (
            <Link key={doc.href} href={doc.href} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 hover:border-green-700 hover:bg-green-50">
              <h2 className="text-xl font-black text-green-950">{doc.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{doc.description}</p>
              <span className="mt-4 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-bold text-white">Open document</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
