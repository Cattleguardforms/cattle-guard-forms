import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CowStop Reusable Concrete Cattle Guard Forms | Ranch & Farm Entrance Solutions",
  description:
    "CowStop reusable concrete cattle guard forms help ranchers, contractors, and concrete companies pour durable cattle guards on site. Request a quote for ranch, farm, driveway, and rural road projects.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CowStop Reusable Concrete Cattle Guard Forms",
    description:
      "Reusable concrete cattle guard forms for ranch entrances, farm roads, contractors, concrete producers, and landowners.",
    url: "/",
    images: ["/products/cattle-guard-hero.png"],
  },
};

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Distributor", "/distributor"],
  ["Contact", "/contact"],
];

const features = [
  ["Built to Reuse", "Reusable concrete cattle guard forms designed for repeat pours season after season.", "↻", "/installations#materials"],
  ["Precision Engineered", "Consistent form dimensions for tight, repeatable concrete cattle guard sections.", "◎", "/faq#sizing"],
  ["Heavy-Duty Strength", "Designed for ranch, farm, loader, contractor, and livestock traffic applications.", "♜", "/installations#steps"],
  ["HS-20 Rated", "Engineering data available for HS-20 load considerations and project review.", "HS-20", "/engineering/hs20-updated"],
  ["Save Time & Money", "Reusable forms reduce freight, labor, steel procurement headaches, and repeat install costs.", "$", "/quote"],
];

const cards = [
  ["Installations", "See real concrete cattle guard projects, pour steps, and placement guidance.", "/installations", "/installations/step%20-%207.png", "View Installations"],
  ["FAQ", "Get straightforward answers on sizing, concrete, curing, HS-20, and steel-vs-concrete questions.", "/faq", "/installations/material.png", "Browse FAQ"],
  ["Blog", "Guides for ranchers, contractors, concrete producers, and distributors planning cattle guard projects.", "/blog", "/products/cattle-guard-hero.png", "Read the Blog"],
];

const useCases = [
  "Ranch driveways and farm entrances",
  "County road and rural access crossings",
  "Feedlots, dairies, and livestock-control points",
  "Contractor and concrete producer installations",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-neutral-700 md:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={href === "/" ? "text-green-900 underline decoration-green-800 decoration-2 underline-offset-8" : "hover:text-green-800"}>{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/distributor" className="hidden rounded-lg border border-green-800 px-4 py-3 text-sm font-bold text-green-900 shadow-sm hover:bg-green-50 sm:inline-flex">
              Distributor Portal
            </Link>
            <Link href="/quote" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Request a Quote</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(34,197,94,0.20),transparent_26%),linear-gradient(90deg,rgba(2,44,34,0.98)_0%,rgba(2,44,34,0.88)_34%,rgba(2,44,34,0.18)_63%,rgba(2,44,34,0.10)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[68%] lg:block">
          <img src="/products/cattle-guard-hero.png" alt="Finished concrete cattle guard installed at a ranch entrance using reusable forms" className="h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/25 to-transparent" />
        </div>
        <div className="absolute bottom-16 right-[7%] z-10 hidden h-48 w-48 rotate-[-8deg] rounded-full border-[5px] border-amber-200/65 bg-green-950/80 text-center font-black uppercase tracking-wide text-amber-100 shadow-2xl backdrop-blur-sm lg:flex lg:flex-col lg:items-center lg:justify-center">
          <div className="absolute inset-3 rounded-full border border-amber-200/40" />
          <span className="text-xs tracking-[0.24em]">Built to Last</span>
          <span className="my-2 h-px w-28 bg-amber-200/60" />
          <span className="text-4xl leading-9 tracking-[0.03em]">CowStop</span>
          <span className="my-2 h-px w-28 bg-amber-200/60" />
          <span className="text-xs tracking-[0.18em]">Rancher Tested</span>
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:min-h-[560px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">CowStop Reusable Concrete Cattle Guard Forms</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">Reusable Concrete Cattle Guard Forms for Ranch & Farm Entrances</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-green-50">
              CowStop helps ranchers, contractors, concrete companies, and landowners pour durable concrete cattle guards on site without relying on expensive fabricated steel grids.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote" className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-4 font-bold text-white shadow-lg shadow-green-950/30 hover:bg-green-500">Request a Quote →</Link>
              <Link href="/installations" className="inline-flex items-center justify-center rounded-lg border border-white/50 px-6 py-4 font-bold text-white hover:bg-white/10">View Installations</Link>
              <Link href="/distributor" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-4 font-bold text-white hover:bg-white/10">Distributor Portal</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm font-semibold text-green-50 sm:grid-cols-4">
              <span>Heavy-Duty</span>
              <span>Precision Fit</span>
              <span>Made in USA</span>
              <span>HS-20 Data</span>
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-6">
        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:grid-cols-5">
          {features.map(([title, body, icon, href]) => (
            <Link key={title} href={href} className="rounded-xl p-4 transition hover:-translate-y-1 hover:bg-green-50 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-50 text-sm font-black text-green-800">{icon}</div>
              <h3 className="mt-3 font-bold text-green-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
              <span className="mt-3 inline-flex text-xs font-bold uppercase tracking-wide text-green-800">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <article className="rounded-3xl border border-green-100 bg-green-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">How CowStop Works</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">Pour permanent concrete cattle guards with reusable formwork.</h2>
            <p className="mt-4 leading-8 text-neutral-700">
              CowStop is a reusable form system for casting permanent concrete cattle guards on site. Instead of buying and hauling heavy steel grids, you set the CowStop forms, pour concrete with local crews, and reuse the forms on future ranch, farm, driveway, and rural road entrance projects.
            </p>
            <p className="mt-4 leading-8 text-neutral-700">
              Contractors and concrete producers use CowStop to standardize cattle guard installations and reduce steel procurement headaches. Landowners get a long-lasting, low-maintenance livestock-control crossing that keeps cattle where they belong while allowing trucks, trailers, and equipment to pass without stopping.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/quote" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Request Pricing</Link>
              <Link href="/engineering/hs20-updated" className="rounded-lg border border-green-800 px-5 py-3 text-sm font-bold text-green-900 hover:bg-white">Engineering Details</Link>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
              <div className="p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Project fit</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Built for ranchers, contractors, and concrete producers.</h2>
                <ul className="mt-6 grid gap-3 text-sm text-neutral-700">
                  {useCases.map((item) => (
                    <li key={item} className="rounded-xl bg-neutral-50 p-4 font-semibold">{item}</li>
                  ))}
                </ul>
                <Link href="/installations" className="mt-6 inline-flex font-bold text-green-800 hover:text-green-900">See installation examples →</Link>
              </div>
              <img src="/installations/material.png" alt="CowStop reusable concrete cattle guard form materials laid out before installation" className="h-full min-h-[300px] w-full object-cover" />
            </div>
          </article>
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Explore</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight">Shop, learn, and install with confidence.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/distributor" className="rounded-lg border border-green-800 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">Distributor Portal</Link>
              <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900">Talk to Support</Link>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {cards.map(([title, body, href, image, cta]) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <img src={image} alt={title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-6">
                  <h3 className="text-xl font-black text-green-900">{title}</h3>
                  <p className="mt-3 leading-7 text-neutral-600">{body}</p>
                  <span className="mt-5 inline-flex font-bold text-green-800">{cta} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-green-950 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-2xl">✓</div>
            <div>
              <h2 className="text-2xl font-black">Trusted by ranchers. Built for repeatable concrete cattle guard pours.</h2>
              <p className="text-green-100">Use CowStop forms to plan durable ranch, farm, contractor, and rural access projects.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/distributor" className="rounded-lg border border-white/40 px-5 py-3 text-center font-bold text-white hover:bg-white/10">Distributor Portal</Link>
            <Link href="/quote" className="rounded-lg bg-white px-5 py-3 text-center font-bold text-green-950 hover:bg-green-50">Request a Quote</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
