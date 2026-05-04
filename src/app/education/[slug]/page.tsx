import Link from "next/link";
import { notFound } from "next/navigation";
import { educationTopics, getEducationTopic } from "@/lib/marketing/education-topics";

export const dynamic = "force-dynamic";

type EducationTopicPageProps = {
  params: Promise<{ slug: string }>;
};

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export async function generateMetadata({ params }: EducationTopicPageProps) {
  const { slug } = await params;
  const topic = getEducationTopic(slug);
  if (!topic) return { title: "Education | Cattle Guard Forms" };
  return {
    title: `${topic.title} | Cattle Guard Forms`,
    description: topic.summary,
  };
}

export default async function EducationTopicPage({ params }: EducationTopicPageProps) {
  const { slug } = await params;
  const topic = getEducationTopic(slug);
  if (!topic) notFound();
  const relatedTopics = educationTopics.filter((item) => item.slug !== topic.slug).slice(0, 3);

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
              <Link key={href} href={href} className="hover:text-green-800">{label}</Link>
            ))}
          </nav>
          <Link href="/quote" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Request a Quote</Link>
        </div>
      </header>

      <article>
        <section className="relative overflow-hidden bg-green-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.20),transparent_26%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <Link href="/education" className="text-sm font-bold uppercase tracking-[0.22em] text-green-200 hover:text-white">Back to Education</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.26em] text-green-200">{topic.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">{topic.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">{topic.summary}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_320px]">
          <div className="max-w-3xl space-y-8">
            {topic.sections.map((section) => (
              <section key={section.heading} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-green-950">{section.heading}</h2>
                <p className="mt-4 text-lg leading-8 text-neutral-700">{section.body}</p>
              </section>
            ))}
            <section className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <h2 className="text-2xl font-black text-green-950">Quick checklist</h2>
              <ul className="mt-4 grid gap-3 text-neutral-800">
                {topic.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-xl bg-white p-4 font-semibold shadow-sm">✓ {bullet}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-800">Need help?</p>
              <h2 className="mt-2 text-xl font-black text-green-950">Review your project before ordering.</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">Send opening width, delivery location, and installation questions to Cattle Guard Forms before you pour.</p>
              <Link href="/contact" className="mt-5 inline-flex rounded-lg bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900">Ask Support</Link>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-800">Related guides</p>
              <div className="mt-4 space-y-3">
                {relatedTopics.map((related) => (
                  <Link key={related.slug} href={`/education/${related.slug}`} className="block rounded-xl border border-neutral-200 p-4 hover:border-green-700 hover:bg-green-50">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-800">{related.eyebrow}</p>
                    <h3 className="mt-2 font-black leading-6 text-green-950">{related.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </article>
    </main>
  );
}
