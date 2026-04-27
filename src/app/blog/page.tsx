import Link from "next/link";
import { getMarketingBlogPosts, starterBlogPosts } from "@/lib/marketing/blog-posts";

export const dynamic = "force-dynamic";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const blogTopics = [
  "CowStop installation tips",
  "Concrete cattle guard planning",
  "Ranch driveway access",
  "Distributor education",
  "Steel vs concrete cattle guards",
  "Livestock control and drainage",
];

export default async function BlogPage() {
  let featuredPosts = starterBlogPosts;
  let blogError = "";

  try {
    const posts = await getMarketingBlogPosts({ publishedOnly: true });
    if (posts.length > 0) featuredPosts = posts;
  } catch (error) {
    blogError = error instanceof Error ? error.message : "Unable to load Supabase blog posts.";
  }

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
            <Link href="/distributor" className="hidden rounded-lg border border-green-800 px-4 py-3 text-sm font-bold text-green-900 shadow-sm hover:bg-green-50 sm:inline-flex">
              Distributor Login
            </Link>
            <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Ask Support</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.20),transparent_26%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <img src="/products/cattle-guard-hero.png" alt="Concrete cattle guard installed at a ranch entrance" className="h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/55 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Cattle Guard Forms Blog</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Ranch, farm, and concrete cattle guard education.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">
            Learn how CowStop and Texan concrete cattle guard forms work, how to plan pours, how to improve installation, and how reusable forms can reduce freight and fabrication costs.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">Request Pricing</Link>
            <Link href="/faq" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Read FAQ</Link>
            <Link href="/installations" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">View Installations</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-6 relative z-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Popular topics</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Quick education for customers and distributors.</h2>
            </div>
            <div className="flex max-w-3xl flex-wrap gap-2">
              {blogTopics.map((topic) => (
                <span key={topic} className="rounded-full bg-green-50 px-3 py-2 text-sm font-semibold text-green-900 ring-1 ring-green-200">{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Featured articles</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">Latest blog posts.</h2>
          </div>
          <Link href="/marketing/blog" className="rounded-lg border border-neutral-300 px-5 py-3 text-sm font-bold text-neutral-900 hover:border-green-800 hover:bg-green-50">
            Manage Blog
          </Link>
        </div>

        {blogError ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Supabase blog posts are not available yet, so starter articles are shown. {blogError}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featuredPosts.map((post) => (
            <article key={post.id} id={post.slug} className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="h-56 w-full bg-green-950/10">
                <img src="/products/cattle-guard-hero.png" alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-green-800">
                  <span>{post.category}</span>
                  {post.publish_date ? (
                    <>
                      <span className="text-neutral-400">•</span>
                      <time dateTime={post.publish_date}>{post.publish_date}</time>
                    </>
                  ) : null}
                </div>
                <h3 className="mt-3 text-xl font-black leading-7 text-green-950">{post.title}</h3>
                <p className="mt-3 leading-7 text-neutral-700">{post.excerpt || post.meta_description || "Read the latest Cattle Guard Forms article."}</p>
                {post.body ? <p className="mt-3 line-clamp-4 text-sm leading-6 text-neutral-600">{post.body}</p> : null}
                <Link href={`/blog#${post.slug}`} className="mt-5 inline-flex rounded-lg bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900">Read article →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-green-950 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-200">Need help choosing a form?</p>
            <h2 className="mt-2 text-3xl font-black">Talk to Cattle Guard Forms before you pour.</h2>
            <p className="mt-2 text-green-100">Get help with quantity, placement, installation planning, and distributor questions.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/distributor" className="rounded-lg border border-white/40 px-5 py-3 text-center font-bold text-white hover:bg-white/10">Distributor Login</Link>
            <Link href="/contact" className="rounded-lg bg-white px-5 py-3 text-center font-bold text-green-950 hover:bg-green-50">Ask Support</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
