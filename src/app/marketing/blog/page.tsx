import Link from "next/link";
import BlogManagerClient from "./BlogManagerClient";

export default function MarketingBlogPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing" className="font-semibold text-green-800">Marketing Portal</Link>
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Home</Link>
            <Link href="/marketing/campaigns" className="hover:text-green-800">Campaigns</Link>
            <Link href="/marketing/seo" className="hover:text-green-800">SEO Tester</Link>
            <Link href="/blog" className="hover:text-green-800">Public Blog</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Marketing Portal</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">AI Blog Management</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Create the blog, choose approved pictures from the blog image library, preview the article package, and publish it to the public blog from one unified workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/blog" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">View Public Blog</Link>
            <Link href="/marketing" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Back to Marketing</Link>
          </div>
        </div>

        <BlogManagerClient />
      </section>
    </main>
  );
}
