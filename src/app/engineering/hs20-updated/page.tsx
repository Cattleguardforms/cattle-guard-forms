import Link from "next/link";

const navItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Installations", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const certificateImage = "/engineering/engineer-certification-cowstop.png";
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
