import Link from "next/link";
import MarketingAiClient from "./MarketingAiClient";

export default function MarketingAiPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="font-semibold text-green-800">Marketing Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Home</Link>
            <Link href="/marketing/marketing-posts" className="hover:text-green-800">Marketing Posts</Link>
            <Link href="/marketing/campaigns" className="hover:text-green-800">Campaigns</Link>
            <Link href="/admin" className="hover:text-green-800">Admin Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">ChatGPT Marketing Assistant</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">AI Marketing Generator</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Generate ready-to-use marketing copy for social media, video scripts, emails, distributor outreach, ads, campaigns, and website content.
            </p>
          </div>
          <Link href="/marketing" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Back to Marketing</Link>
        </div>

        <MarketingAiClient />
      </section>
    </main>
  );
}
