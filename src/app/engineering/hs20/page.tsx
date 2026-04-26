import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
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
          <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">Use this page as the customer-facing engineering reference. The full uploaded certificate package can be added as a downloadable PDF asset once it is placed into the public files folder.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Certification summary</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">HS-20 Rated</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-700">
              <p><strong className="text-neutral-950">Rating:</strong> HS-20 engineering data available.</p>
              <p><strong className="text-neutral-950">Use case:</strong> customer confidence, distributor documentation, and support reference.</p>
              <p><strong className="text-neutral-950">Concrete note:</strong> FAQ and installation pages reference 4000 PSI concrete for the HS-20-rated configuration.</p>
              <p><strong className="text-neutral-950">Certificate status:</strong> certificate page placeholder is live; final scanned certificate image/PDF should be added to public assets next.</p>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/faq#hs20" className="rounded-lg bg-green-800 px-5 py-3 text-center font-bold text-white hover:bg-green-900">Read HS-20 FAQ</Link>
              <Link href="/contact" className="rounded-lg border border-neutral-300 px-5 py-3 text-center font-bold hover:border-green-800 hover:bg-green-50">Request Engineering Copy</Link>
            </div>
          </aside>

          <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="rounded-2xl border-8 border-neutral-100 bg-white p-8 shadow-inner">
              <div className="border-b-4 border-green-900 pb-6 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-green-800">Engineering Certification</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-neutral-950">HS-20 Rated</h2>
                <p className="mt-2 text-lg font-semibold text-neutral-600">Cattle Guard Forms</p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl bg-green-50 p-5 ring-1 ring-green-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-800">Load rating</p>
                  <p className="mt-2 text-3xl font-black text-green-950">HS-20</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">Configuration</p>
                  <p className="mt-2 text-2xl font-black text-neutral-950">4000 PSI Concrete</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-5 ring-1 ring-neutral-200 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">Engineering package</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="h-28 rounded-lg border border-neutral-300 bg-[linear-gradient(135deg,#f8fafc,#e5e7eb)] p-3 text-xs font-semibold text-neutral-500">Stamped Drawing<br />Page 1</div>
                    <div className="h-28 rounded-lg border border-neutral-300 bg-[linear-gradient(135deg,#f8fafc,#e5e7eb)] p-3 text-xs font-semibold text-neutral-500">Design Detail<br />Page 2</div>
                    <div className="h-28 rounded-lg border border-neutral-300 bg-[linear-gradient(135deg,#f8fafc,#e5e7eb)] p-3 text-xs font-semibold text-neutral-500">Certification<br />Page 3</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
                <strong>Note:</strong> This is a live certificate display page. The exact scanned certificate image/PDF should be uploaded into <code className="rounded bg-white px-1">/public/engineering/</code> and then this card can show the real certificate preview directly.
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
