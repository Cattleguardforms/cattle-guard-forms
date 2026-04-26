import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const certificateImage = "data:image/webp;base64,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";

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
          <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">The updated HS-20 engineering certification sheet is shown below as the live certificate preview.</p>
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
              <p><strong className="text-neutral-950">Certificate status:</strong> updated certificate preview is embedded on this page.</p>
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
                <h2 className="mt-1 text-3xl font-black tracking-tight">Engineering Certification HS-20</h2>
              </div>
              <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-900 ring-1 ring-green-200">HS-20</span>
            </div>
            <a href={certificateImage} target="_blank" rel="noreferrer" className="mt-6 block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-inner transition hover:-translate-y-1 hover:shadow-xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-600">Updated Engineering Certificate</p>
              <img src={certificateImage} alt="Engineering Certification HS-20 for Cattle Guard Forms" className="mx-auto w-full rounded-xl border border-neutral-200 bg-white object-contain shadow-sm" />
              <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-green-800">Click to open larger preview</p>
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
