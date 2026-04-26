import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const certPages = [
  {
    label: "Engineering Certificate Page 1",
    src: "data:image/webp;base64,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",
  },
  {
    label: "Engineering Certificate Page 2",
    src: "data:image/webp;base64,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",
  },
];

export default function HS20EngineeringPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
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
          <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-900">Request a Quote</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.25),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Engineering certificate</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">HS-20 Rated Engineering Data</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">The uploaded HS-20 engineering certificate is now shown below as a live certificate preview.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Certification summary</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">HS-20 Rated</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-700">
              <p><strong className="text-neutral-950">Rating:</strong> HS-20 engineering data available.</p>
              <p><strong className="text-neutral-950">Use case:</strong> customer confidence, distributor documentation, and support reference.</p>
              <p><strong className="text-neutral-950">Concrete note:</strong> FAQ and installation pages reference 4000 PSI concrete for the HS-20-rated configuration.</p>
              <p><strong className="text-neutral-950">Certificate status:</strong> live preview is embedded on this page.</p>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/faq#hs20" className="rounded-lg bg-green-800 px-5 py-3 text-center font-bold text-white hover:bg-green-900">Read HS-20 FAQ</Link>
              <Link href="/contact" className="rounded-lg border border-neutral-300 px-5 py-3 text-center font-bold hover:border-green-800 hover:bg-green-50">Request Engineering Copy</Link>
            </div>
          </aside>

          <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Actual certificate preview</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">HS-20 Engineering Certificate</h2>
              </div>
              <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-900 ring-1 ring-green-200">HS-20</span>
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {certPages.map((page) => (
                <a key={page.label} href={page.src} target="_blank" rel="noreferrer" className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-inner transition hover:-translate-y-1 hover:shadow-xl">
                  <p className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-600">{page.label}</p>
                  <img src={page.src} alt={page.label} className="mx-auto w-full rounded-xl border border-neutral-200 bg-white object-contain shadow-sm" />
                  <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-green-800">Click to open larger preview</p>
                </a>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
