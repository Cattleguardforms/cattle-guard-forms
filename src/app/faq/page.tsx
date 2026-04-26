import Link from "next/link";

const openingRows = [
  { opening: "12 ft opening", recommendation: "6 pours", layout: "2 wide x 3 deep", notes: "Standard recommended layout for a 12 ft opening." },
  { opening: "16 ft opening", recommendation: "2 eight-foot sections", layout: "Two tight sections across", notes: "A 16 ft driveway should read as two 8 ft sections with a small center seam." },
  { opening: "18 ft opening", recommendation: "9 pours", layout: "3 wide x 3 deep", notes: "Paint yellow drive lines for heavy trucks and equipment." },
  { opening: "24 ft opening", recommendation: "3 eight-foot sections", layout: "3 sections across", notes: "Requires about 4 cubic yards of concrete total." },
];

const palletRows = [
  { quantity: "1 CowStop", dimensions: "72 x 48 x 20 in", weight: "105 lb", palletCount: "1 pallet" },
  { quantity: "2 CowStops", dimensions: "72 x 48 x 20 in", weight: "190 lb", palletCount: "1 pallet" },
  { quantity: "3 CowStops", dimensions: "72 x 48 x 36 in", weight: "270 lb", palletCount: "1 pallet" },
  { quantity: "4 CowStops", dimensions: "72 x 48 x 36 in", weight: "355 lb", palletCount: "1 pallet" },
  { quantity: "5 CowStops", dimensions: "72 x 48 x 52 in", weight: "440 lb", palletCount: "1 pallet" },
  { quantity: "6 CowStops", dimensions: "72 x 48 x 52 in", weight: "525 lb", palletCount: "1 pallet max" },
];

const quickFacts = [
  ["HS-20 Rated", "Engineering certification available"],
  ["Form size", "6 ft long x 21.5 in wide x 16 in high"],
  ["Groove depth", "9 in deep grooves"],
  ["Form weight", "80 lb reusable mold"],
  ["Recommended concrete", "4000 PSI concrete mix"],
  ["Typical form removal", "48–72 hours depending on conditions"],
  ["Heavy vehicle cure target", "28 days"],
  ["Pallet max", "Only 6 CowStops fit on one pallet"],
];

const faqs = [
  ["What are the CowStop reusable mold specs?", "The CowStop reusable mold is 6 feet long, 21.5 inches wide, and 16 inches high. The grooves are 9 inches deep, and the reusable form weighs approximately 80 pounds. These specs should be used as the base product dimensions and weight for pallet/shipping setup."],
  ["How many CowStops fit on one pallet?", "A maximum of 6 CowStops fit on one pallet. For 1–6 CowStops, use the pallet dimension and weight table on this page. For 7 or more CowStops, start a second pallet and repeat the same planning logic."],
  ["What does HS-20 rated mean?", "The engineering certificate package references HS-20 loading and includes stamped engineering drawings and certification pages. Use the certificate package when customers need engineering documentation."],
  ["How should a 16 ft driveway look?", "A 16 ft driveway should be represented by two 8 ft cattle guard sections side by side, tight together, with only a narrow center seam. It should not look like one short form only spans half the driveway."],
  ["How many pours are suggested for 12 ft and 18 ft openings?", "For a 12 ft opening, use 6 pours arranged 2 wide x 3 deep. For an 18 ft opening, use 9 pours arranged 3 wide x 3 deep."],
  ["What concrete strength is recommended?", "Use 4000 PSI concrete for the standard HS-20-rated configuration shown in the engineering material."],
  ["How long before heavy equipment can drive over a new pour?", "Use 28 days as the heavy vehicle cure target before running heavy semi trailers or farm equipment over new pours."],
  ["What release agent should be used?", "Use a non-petroleum release agent such as vegetable oil, Pam, car wax, grease, or another concrete release agent."],
  ["Can a concrete truck pour the form?", "Yes. Pour slowly and make sure to settle the concrete around rebar, hardware, and corners so air pockets are reduced."],
  ["Do you recommend a compacted base?", "Yes. Compact or tamp the installation area and use a gravel layer where needed for stability and drainage."],
  ["Can the forms be reused?", "Yes. The form system is designed for repeat pours, which is the main cost-saving advantage over buying and shipping one finished steel cattle guard at a time."],
  ["What should customers do if they need layout help?", "Send them to support or the quote form so the team can help with driveway width, opening size, number of pours, and install plan."],
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-xl font-black uppercase leading-5 tracking-wide text-green-900 sm:block">Cattle Guard<br />Forms</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-700 md:flex">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/faq" className="text-green-900 underline decoration-green-800 decoration-2 underline-offset-8">FAQ</Link>
            <Link href="/blog" className="hover:text-green-800">Blog</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
          <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Ask Support</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_78%_20%,rgba(34,197,94,0.35),transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_0.8fr] lg:py-24 relative">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Frequently asked questions</p>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-7xl">Straight answers for ranch-ready installs.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">Sizing, HS-20 engineering, concrete requirements, curing, lifting, drainage, product specs, pallet dimensions, and layout guidance for Cattle Guard Forms.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">Ask a Question</Link>
              <Link href="/installations" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">View Installations</Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <img src="/products/cattle-guard-hero.png" alt="Cattle guard installed at a ranch entrance" className="h-full min-h-[320px] w-full rounded-[1.35rem] object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-6 relative z-10">
        <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:grid-cols-4 lg:grid-cols-8">
          {quickFacts.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-green-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-green-800">{label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-700">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="specs" className="mx-auto max-w-7xl px-6 pt-16">
        <div className="rounded-3xl border border-green-100 bg-green-50 p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Specs</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-green-950">CowStop reusable mold dimensions.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Length</p><p className="mt-2 text-2xl font-black">6 ft</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Width</p><p className="mt-2 text-2xl font-black">21.5 in</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Height</p><p className="mt-2 text-2xl font-black">16 in</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Weight</p><p className="mt-2 text-2xl font-black">80 lb</p></div>
          </div>
          <p className="mt-5 leading-8 text-neutral-700">Grooves are 9 inches deep. These are the base product specs to use for pallet dimensions, pallet weight planning, freight quoting, and shipping setup.</p>
        </div>
      </section>

      <section id="pallets" className="mx-auto max-w-7xl px-6 pt-10">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="bg-green-950 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-200">Pallet dimensions and weights</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">1–6 CowStops per pallet.</h2>
            <p className="mt-4 max-w-3xl leading-8 text-green-50">Only six CowStops fit on one pallet. Use this table for distributor quoting, freight setup, and Echo shipping calculations.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50">
                <tr><th className="px-5 py-4">Quantity</th><th className="px-5 py-4">Pallet dimensions</th><th className="px-5 py-4">Pallet weight</th><th className="px-5 py-4">Pallet count</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {palletRows.map((row) => (
                  <tr key={row.quantity}><td className="px-5 py-4 font-bold text-green-950">{row.quantity}</td><td className="px-5 py-4">{row.dimensions}</td><td className="px-5 py-4">{row.weight}</td><td className="px-5 py-4 text-neutral-600">{row.palletCount}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-neutral-200 bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-950">
            Distributor note: 6 CowStops is the maximum per pallet. Orders over 6 require an additional pallet and should repeat the same 1–6 pallet planning table for the remaining quantity.
          </div>
        </div>
      </section>

      <section id="hs20" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-3xl border border-green-100 bg-green-50 p-8 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-green-200 bg-white text-2xl font-black text-green-800">HS-20</div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Engineering certificate</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">HS-20 Engineering Data Available</h2>
                <p className="mt-3 leading-7 text-neutral-700">The uploaded engineering package includes stamped drawings and a certification page referencing HS-20 loading. Use this as the credibility section for customers who ask about rating and load documentation.</p>
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-[0.95fr_1.05fr]">
              <div className="p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Opening guide</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Sizing and layout planning.</h2>
                <p className="mt-3 leading-7 text-neutral-700">For design visuals, a 16 ft driveway should be shown with two tight 8 ft sections across the opening, not one undersized form.</p>
              </div>
              <div className="bg-neutral-50 p-4">
                <img src="/installations/step%20-%207.png" alt="Finished cattle guard section layout" className="h-full min-h-[260px] w-full rounded-2xl object-cover" />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Sizing table</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Opening size and pour planning.</h2>
          <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-green-950 text-white"><tr><th className="px-5 py-4">Opening</th><th className="px-5 py-4">Recommendation</th><th className="px-5 py-4">Layout</th><th className="px-5 py-4">Notes</th></tr></thead>
              <tbody className="divide-y divide-neutral-200">
                {openingRows.map((row) => (
                  <tr key={row.opening}><td className="px-5 py-4 font-bold">{row.opening}</td><td className="px-5 py-4">{row.recommendation}</td><td className="px-5 py-4">{row.layout}</td><td className="px-5 py-4 text-neutral-600">{row.notes}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">FAQ</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight">Common questions.</h2>
        <div className="mt-8 divide-y divide-neutral-200 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group p-6 open:bg-green-50/50">
              <summary className="cursor-pointer list-none text-lg font-black text-neutral-950 marker:hidden">
                <span>{question}</span>
                <span className="float-right ml-4 text-green-800 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 leading-8 text-neutral-700">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl bg-green-950 px-8 py-12 text-white shadow-xl">
          <h2 className="text-4xl font-black tracking-tight">Still have questions?</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-green-50">Contact us for help choosing the right layout, number of pours, installation approach, distributor orders, or pallet freight planning.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">Contact Support</Link>
            <Link href="/quote" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Shop Forms</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
