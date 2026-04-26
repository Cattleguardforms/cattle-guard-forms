import Link from "next/link";

const steps = [
  {
    title: "Prep the Form",
    body:
      "Apply concrete release agent inside the reusable form. Set the rebar, tomato stakes, J-bolts, and tie wire according to the reinforcement plan before pouring.",
    imageSrc: "/installations/step%20-%201.jpg",
    imageAlt: "Cattle Guard Forms reusable form prepared with rebar and lift points",
  },
  {
    title: "Pour 4000 PSI Concrete",
    body:
      "Pour 4000 PSI concrete into the form evenly. Work the mix around reinforcement, corners, and anchor points to reduce voids and keep the finished section consistent.",
    imageSrc: "/installations/step%20-%202.jpg",
    imageAlt: "Concrete being poured into the reusable cattle guard form",
  },
  {
    title: "Settle, Level, and Cure",
    body:
      "Tap or vibrate the form to release trapped air, strike off the top surface, and let the concrete cure undisturbed. Curing time depends on temperature and humidity.",
    imageSrc: "/installations/step%20-%203.jpg",
    imageAlt: "Concrete settled and leveled inside the form",
  },
  {
    title: "Lift and Place",
    body:
      "Use the embedded lifting hardware with a loader, forklift, tractor, or crane. Set the cured cattle guard section square and level on a compacted, well-drained base.",
    imageSrc: "/installations/step%20-%207.png",
    imageAlt: "Finished concrete cattle guard section ready for positioning",
  },
];

const materials = [
  "Concrete release agent or grease for the inside of the form",
  "Two 20-foot bars of 1/2-inch rebar cut to the required lengths",
  "Two tomato stakes, each 17 inches long, for cross members",
  "Two 10-inch J-bolts for lifting while removing from the form",
  "Two 8-inch J-bolts for lifting and placing the finished section",
  "12 bags of 80 lb, 4000 PSI concrete mix per pour",
  "Tie wire or plastic zip ties for fastening rebar and hardware",
];

const highlights = [
  ["4000 PSI", "Recommended concrete strength"],
  ["HS-20", "Engineering certification available"],
  ["48–72 hrs", "Typical form removal window"],
  ["28 days", "Heavy vehicle cure target"],
];

export default function InstallationsPage() {
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
            <Link href="/installations" className="text-green-900 underline decoration-green-800 decoration-2 underline-offset-8">Installations</Link>
            <Link href="/faq" className="hover:text-green-800">FAQ</Link>
            <Link href="/blog" className="hover:text-green-800">Blog</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
          <Link href="/contact" className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Request a Quote</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-green-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.20),transparent_26%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <img src="/installations/step%20-%207.png" alt="Finished cattle guard section ready for placement" className="h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/55 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-green-200">Installation guide</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Simple steps. Strong results.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">Prepare the form, pour the section, cure the concrete, and set the finished cattle guard into a compacted, well-drained gate opening.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#steps" className="rounded-lg bg-white px-6 py-4 text-center font-bold text-green-950 hover:bg-green-50">View Steps</a>
            <a href="#video" className="rounded-lg border border-white/40 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Watch Video</a>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-6 relative z-10">
        <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:grid-cols-4">
          {highlights.map(([value, label]) => (
            <div key={label} className="rounded-xl bg-green-50 p-5 text-center">
              <p className="text-3xl font-black text-green-900">{value}</p>
              <p className="mt-2 text-sm font-semibold text-neutral-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-green-100 bg-green-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Material list</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">What you need for each pour</h2>
            <ol className="mt-6 list-decimal space-y-3 pl-6 leading-7 text-neutral-700">
              {materials.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
            <img src="/installations/material.png" alt="Cattle Guard Forms material layout" className="h-auto w-full rounded-2xl object-contain" />
          </div>
        </div>
      </section>

      <section id="steps" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Process</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">From prep to placement.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <img src={step.imageSrc} alt={step.imageAlt} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-800 text-sm font-black text-white">{index + 1}</span>
                  <h3 className="mt-4 text-xl font-black text-green-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="video" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-800">Video guide</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">Watch the installation walkthrough.</h2>
            <p className="mt-4 leading-8 text-neutral-700">Use the video with the step cards above to plan the pour, lifting process, site preparation, and final placement.</p>
            <a href="https://www.youtube.com/watch?v=ineaalZN26o" target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-lg bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900">Open on YouTube</a>
          </div>
          <div className="aspect-video overflow-hidden rounded-3xl border border-neutral-200 bg-black shadow-xl">
            <iframe className="h-full w-full" src="https://www.youtube-nocookie.com/embed/ineaalZN26o" title="Cattle Guard Forms installation video" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        </div>
      </section>
    </main>
  );
}
