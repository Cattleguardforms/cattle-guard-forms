import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const features = [
  ["Built to Reuse", "Durable forms designed for repeat pours season after season.", "↻"],
  ["Precision Engineered", "Consistent dimensions for a tight, repeatable fit.", "◎"],
  ["Heavy-Duty Strength", "Designed for ranch, farm, loader, and livestock traffic.", "♜"],
  ["HS-20 Rated", "Engineering data available for HS-20 loading.", "HS-20"],
  ["Save Time & Money", "Reusable forms reduce freight, labor, and material waste.", "$"],
];

const cards = [
  ["Installations", "See real cattle guard projects, pour steps, and placement guidance.", "/installations", "/installations/step%20-%207.png", "View Installations"],
  ["FAQ", "Get straightforward answers on sizing, concrete, curing, and HS-20 rating.", "/faq", "/installations/material.png", "Browse FAQ"],
  ["Blog", "Tips, how-tos, and field updates for ranchers and distributors.", "/blog", "/products/cattle-guard-hero.png", "Read the Blog"],
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
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={href === "/" ? "text-green-900 underline decoration-green-800 decoration-2 underline-offset-8" : "hover:text-green-800"}>{label}</Link>
            ))}
          </nav>
          <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Request a Quote</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(34,197,94,0.20),transparent_26%),linear-gradient(90deg,rgba(2,44,34,0.98)_0%,rgba(2,44,34,0.88)_34%,rgba(2,44,34,0.18)_63%,rgba(2,44,34,0.10)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[68%] lg:block">
          <img src="/products/cattle-guard-hero.png" alt="Concrete cattle guard installed at a ranch entrance" className="h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/25 to-transparent" />
        </div>
        <div className="absolute bottom-20 right-[6%] z-10 hidden h-44 w-44 rotate-[-7deg] rounded-full border-[6px] border-amber-200/45 bg-amber-950/70 text-center font-black uppercase tracking-wide text-amber-100 shadow-2xl backdrop-blur-sm lg:flex lg:flex-col lg:items-center lg:justify-center">
          <span className="text-xs tracking-[0.22em]">Built to Last</span>
          <span className="my-2 h-px w-24 bg-amber-200/50" />
          <span className="text-2xl leading-6">Cattle Guard<br />Forms</span>
          <span className="my-2 h-px w-24 bg-amber-200/50" />
          <span className="text-xs tracking-[0.18em]">Rancher Tested</span>
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:min-h-[560px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Cattle Guard Forms</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">Reusable. Reliable.<br />Built to Last.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-green-50">Durable, precision-engineered reusable forms for strong, uniform concrete cattle guard sections — again and again.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote" className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-4 font-bold text-white shadow-lg shadow-green-950/30 hover:bg-green-500">Shop Now →</Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-4 font-bold text-white hover:bg-white/10">Request a Quote</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm font-semibold text-green-50 sm:grid-cols-4">
              <span>◉ Heavy-Duty</span>
              <span>◉ Precision Fit</span>
              <span>◉ Made in USA</span>
              <span>◉ HS-20 Rated</span>
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-6">
        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:grid-cols-5">
          {features.map(([title, body, icon]) => (
            <div key={title} className="rounded-xl p-4 transition hover:-translate-y-1 hover:bg-green-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-50 text-sm font-black text-green-800">{icon}</div>
              <h3 className="mt-3 font-bold text-green-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-green-100 bg-green-50 p-8 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-green-200 bg-white text-2xl font-black text-green-800">HS-20</div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Engineering data</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">HS-20 Rated</h2>
                <p className="mt-3 leading-7 text-neutral-700">Engineering documentation is available for HS-20 loading. The certification package includes engineering drawings and a stamped certification sheet.</p>
                <Link href="/faq#hs20" className="mt-5 inline-flex rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">View HS-20 Details</Link>
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
              <div className="p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">How it works</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Simple steps. Strong results.</h2>
                <div className="mt-6 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                  {[["1", "Prep"], ["2", "Pour"], ["3", "Cure"], ["4", "Lift & Place"]].map(([number, label]) => (
                    <div key={label} className="rounded-xl bg-neutral-50 p-4"><span className="mr-2 rounded-full bg-green-800 px-2 py-1 text-xs font-bold text-white">{number}</span>{label}</div>
                  ))}
                </div>
                <Link href="/installations" className="mt-6 inline-flex font-bold text-green-800 hover:text-green-900">View Instructions →</Link>
              </div>
              <img src="/installations/material.png" alt="Cattle Guard Forms material layout" className="h-full min-h-[300px] w-full object-cover" />
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
            <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900">Talk to Support</Link>
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
              <h2 className="text-2xl font-black">Trusted by ranchers. Proven in the field.</h2>
              <p className="text-green-100">Cattle Guard Forms are tough, accurate, and built for repeatable pours.</p>
            </div>
          </div>
          <Link href="/quote" className="rounded-lg bg-white px-5 py-3 font-bold text-green-950 hover:bg-green-50">Shop Forms</Link>
        </div>
      </section>
    </main>
  );
}
