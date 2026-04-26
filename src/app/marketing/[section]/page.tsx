import Link from "next/link";
import MarketingSectionClient, { marketingSections } from "./MarketingSectionClient";

export function generateStaticParams() {
  return Object.keys(marketingSections).map((section) => ({ section }));
}

function formatSectionTitle(section: string) {
  return section
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function MissingMarketingModule({ section }: { section: string }) {
  const title = formatSectionTitle(section);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="font-semibold text-green-800">Marketing Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Home</Link>
            <Link href="/admin" className="hover:text-green-800">Admin Portal</Link>
            <Link href="/admin/crm-import" className="hover:text-green-800">CRM Import</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Marketing Portal</p>
        <div className="mt-3 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <h1 className="text-4xl font-bold tracking-tight">{title || "Marketing Module"}</h1>
          <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
            This marketing module has not been fully configured yet, but this route is now active and no longer returns a 404.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/marketing" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Back to Marketing</Link>
            <Link href="/marketing/social-media-hub" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Open Social Media Hub</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function MarketingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const config = marketingSections[section];

  if (!config) {
    return <MissingMarketingModule section={section} />;
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="font-semibold text-green-800">Marketing Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Home</Link>
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
            <Link href="/admin/crm-import" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">CRM Import</Link>
          </div>
        </div>

        <MarketingSectionClient section={section} />
      </section>
    </main>
  );
}
