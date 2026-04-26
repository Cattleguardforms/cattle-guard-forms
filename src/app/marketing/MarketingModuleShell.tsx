import Link from "next/link";
import MarketingSectionClient, { marketingSections } from "./[section]/MarketingSectionClient";

function formatSectionTitle(section: string) {
  return section
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MarketingModuleShell({ section }: { section: string }) {
  const config = marketingSections[section] ?? {
    title: formatSectionTitle(section) || "Marketing Module",
    description: "Create and manage records for this marketing module.",
  };

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

        <MarketingSectionClient section={section} />
      </section>
    </main>
  );
}
