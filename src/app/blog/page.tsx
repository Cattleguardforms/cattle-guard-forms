import Link from "next/link";

const featuredPosts = [
  {
    title: "How Reusable Concrete Cattle Guard Forms Help Ranchers Save on Steel Freight",
    category: "Cost savings",
    date: "2026-04-26",
    excerpt:
      "Traditional steel cattle guards are expensive to fabricate, heavy to ship, and often slow to source. CowStop gives landowners a reusable form system for pouring durable concrete cattle guard sections on-site.",
    image: "/products/cattle-guard-hero.png",
    slug: "reusable-concrete-cattle-guard-forms-save-on-steel-freight",
  },
  {
    title: "CowStop Pour Planning: How Many Sections You Need for 12, 16, and 18 Foot Openings",
    category: "Installation planning",
    date: "2026-04-26",
    excerpt:
      "A practical guide to opening size, pour count, layout planning, and when to consider CowStop sections, custom dividers, or Texan forms.",
    image: "/installations/step%20-%202.jpg",
    slug: "cowstop-pour-planning-12-16-18-foot-openings",
  },
  {
    title: "Why Elevated Cattle Guards Drain Better and Help Discourage Cattle Crossing",
    category: "Installation tips",
    date: "2026-04-26",
    excerpt:
      "Elevation, drainage, open gaps, and fencing wings all matter. Here is why a cattle guard should not be installed below grade and how to improve long-term performance.",
    image: "/installations/step%20-%207.png",
    slug: "why-elevated-cattle-guards-drain-better",
  },
];

const blogTopics = [
  "CowStop installation tips",
  "Concrete cattle guard planning",
  "Ranch driveway access",
  "Distributor education",
  "Steel vs concrete cattle guards",
  "Livestock control and drainage",
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/faq" className="hover:text-green-800">FAQ</Link>
            <Link href="/blog" className="text-green-800">Blog</Link>
          </nav>
        </div>
      </header>

      <section className="bg-neutral-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Cattle Guard Forms Blog</p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-neutral-950">Ranch, Farm, and Concrete Cattle Guard Education</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-700">
              Learn how CowStop and Texan concrete cattle guard forms work, how to plan pours, how to improve installation, and how reusable forms can reduce freight and fabrication costs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Request Pricing</Link>
              <Link href="/faq" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold hover:bg-white">Read FAQ</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Popular topics</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {blogTopics.map((topic) => (
                <span key={topic} className="rounded-full bg-green-50 px-3 py-2 text-sm font-medium text-green-900 ring-1 ring-green-200">{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Featured articles</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Latest Blog Posts</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featuredPosts.map((post) => (
            <article key={post.slug} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <img src={post.image} alt={post.title} className="h-56 w-full object-cover" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-green-800">
                  <span>{post.category}</span>
                  <span className="text-neutral-400">•</span>
                  <time dateTime={post.date}>{post.date}</time>
                </div>
                <h3 className="mt-3 text-xl font-semibold leading-7 text-neutral-950">{post.title}</h3>
                <p className="mt-3 leading-7 text-neutral-700">{post.excerpt}</p>
                <Link href={`/blog#${post.slug}`} className="mt-5 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Read article</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
