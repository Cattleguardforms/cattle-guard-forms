import Link from "next/link";
import { educationTopics } from "@/lib/marketing/education-topics";

export const dynamic = "force-dynamic";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export default function EducationPage() {
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

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.20),transparent_26%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[55%] lg:block">
          <img src="/products/cattle-guard-hero.png" alt="Concrete cattle guard at ranch entrance" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/65 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Customer Education</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Learn before you pour.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">
            Practical guides for customers comparing steel and concrete cattle guards, planning ranch entrances, reviewing installation basics, and understanding reusable form benefits.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">Request Pricing</Link>
            <Link href="/contact" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Ask Support</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {educationTopics.map((topic) => (
            <Link key={topic.slug} href={`/education/${topic.slug}`} className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-700 hover:shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-800">{topic.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-black leading-8 text-green-950 group-hover:text-green-800">{topic.title}</h2>
              <p className="mt-4 leading-7 text-neutral-700">{topic.summary}</p>
              <span className="mt-5 inline-flex font-bold text-green-800">Open guide →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-green-950 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-200">Need help choosing a form?</p>
            <h2 className="mt-2 text-3xl font-black">Talk to Cattle Guard Forms before you pour.</h2>
            <p className="mt-2 text-green-100">Get help with quantity, placement, installation planning, and delivery questions.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/faq" className="rounded-lg border border-white/40 px-5 py-3 text-center font-bold text-white hover:bg-white/10">Read FAQ</Link>
            <Link href="/contact" className="rounded-lg bg-white px-5 py-3 text-center font-bold text-green-950 hover:bg-green-50">Ask Support</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
