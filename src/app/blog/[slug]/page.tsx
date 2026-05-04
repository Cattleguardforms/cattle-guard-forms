import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketingBlogPostBySlug, getStarterBlogPostBySlug, starterBlogPosts } from "@/lib/marketing/blog-posts";

export const dynamic = "force-dynamic";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = (await getMarketingBlogPostBySlug(slug).catch(() => null)) || getStarterBlogPostBySlug(slug);
  if (!post) return { title: "Blog Article | Cattle Guard Forms" };
  return {
    title: post.seo_title || post.title,
    description: post.meta_description || post.excerpt || "Cattle Guard Forms article.",
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = (await getMarketingBlogPostBySlug(slug).catch(() => null)) || getStarterBlogPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = starterBlogPosts.filter((related) => related.slug !== post.slug).slice(0, 2);
  const paragraphs = (post.body || post.excerpt || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={href === "/blog" ? "text-green-900 underline decoration-green-800 decoration-2 underline-offset-8" : "hover:text-green-800"}>{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/distributor" className="hidden rounded-lg border border-green-800 px-4 py-3 text-sm font-bold text-green-900 shadow-sm hover:bg-green-50 sm:inline-flex">Distributor Login</Link>
            <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Ask Support</Link>
          </div>
        </div>
      </header>

      <article>
        <section className="relative overflow-hidden bg-green-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.20),transparent_26%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block">
            <img src="/products/cattle-guard-hero.png" alt={post.title} className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/65 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <Link href="/blog" className="text-sm font-bold uppercase tracking-[0.22em] text-green-200 hover:text-white">Back to Blog</Link>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-green-200">
              <span>{post.category}</span>
              {post.publish_date ? (
                <>
                  <span className="text-green-400">•</span>
                  <time dateTime={post.publish_date}>{post.publish_date}</time>
                </>
              ) : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">{post.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">{post.excerpt || post.meta_description}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_320px]">
          <div className="max-w-3xl">
            <div className="prose prose-neutral max-w-none prose-p:text-lg prose-p:leading-8 prose-p:text-neutral-700 prose-strong:text-green-950">
              {paragraphs.length > 0 ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>This article is being prepared.</p>}
            </div>
            <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6">
              <h2 className="text-2xl font-black text-green-950">Need help planning your cattle guard project?</h2>
              <p className="mt-3 leading-7 text-green-950">Send Cattle Guard Forms your opening width, delivery location, and project questions before you pour. We can help review quantity, freight, and distributor questions.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/quote" className="rounded-lg bg-green-800 px-5 py-3 text-center font-bold text-white hover:bg-green-900">Request Pricing</Link>
                <Link href="/contact" className="rounded-lg border border-green-800 px-5 py-3 text-center font-bold text-green-950 hover:bg-white">Ask Support</Link>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-800">Article details</p>
              <dl className="mt-4 space-y-3 text-sm text-neutral-700">
                <div><dt className="font-bold text-neutral-950">Category</dt><dd>{post.category}</dd></div>
                {post.publish_date ? <div><dt className="font-bold text-neutral-950">Published</dt><dd>{post.publish_date}</dd></div> : null}
                <div><dt className="font-bold text-neutral-950">Topic</dt><dd>{post.campaign || "Cattle guard education"}</dd></div>
              </dl>
            </div>

            {relatedPosts.length > 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-800">Related reading</p>
                <div className="mt-4 space-y-4">
                  {relatedPosts.map((related) => (
                    <Link key={related.id} href={`/blog/${related.slug}`} className="block rounded-xl border border-neutral-200 p-4 hover:border-green-700 hover:bg-green-50">
                      <p className="text-xs font-bold uppercase tracking-wide text-green-800">{related.category}</p>
                      <h3 className="mt-2 font-black leading-6 text-green-950">{related.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </article>
    </main>
  );
}
