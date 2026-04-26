import Link from "next/link";

const applications = [
  {
    title: "Ranch Entrances",
    description:
      "Keep livestock contained while allowing trucks, trailers, equipment, and visitors to move through without stopping to open and close gates.",
  },
  {
    title: "Pasture Crossings",
    description:
      "Control movement between fields, paddocks, and grazing areas while reducing daily gate handling and improving traffic flow across your property.",
  },
  {
    title: "Driveways & Private Roads",
    description:
      "Maintain open vehicle access while helping prevent livestock from escaping onto driveways, private roads, and rural access lanes.",
  },
];

const benefits = [
  "Make your own concrete cattle guard sections on-site",
  "Avoid oversized steel freight and traditional cattle guard markups",
  "Reusable form system for multiple pours and future projects",
  "Built for ranches, farms, driveways, pastures, and private roads",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/brand/cgf-logo.png"
              alt="Cattle Guard Forms"
              className="h-16 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">
              Home
            </Link>
            <Link href="/quote" className="hover:text-green-800">
              Shop
            </Link>
            <Link href="/installations" className="hover:text-green-800">
              Installations
            </Link>
            <Link href="/faq" className="hover:text-green-800">
              FAQ
            </Link>
            <Link href="/blog" className="hover:text-green-800">
              Blog
            </Link>
            <Link href="/distributor" className="hover:text-green-800">
              Distributor Portal
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-green-800 ring-1 ring-green-200">
            Reusable cattle guard forms
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-neutral-950 md:text-6xl">
            Make Your Own Concrete Cattle Guards and Save on Steel Freight
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
            CattleGuardForms.com is a trusted nationwide provider of innovative livestock and ranching solutions. We are ranchers ourselves, so we know what works, what lasts, and what is worth your money. Our mission is simple: help landowners build smarter, save more, and spend less time fighting gates.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-700">
            The CowStop reusable form lets you pour durable concrete cattle guard sections on-site using locally sourced concrete and rebar. Skip the heavy shipping fees, steel markups, and long lead times. Put your money where it belongs — back into your operation.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quote"
              className="inline-flex justify-center rounded bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900"
            >
              Request CowStop Pricing
            </Link>
            <Link
              href="/installations"
              className="inline-flex justify-center rounded border border-neutral-300 px-6 py-3 font-semibold text-neutral-950 hover:bg-neutral-50"
            >
              View Installation Instructions
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
          <img
            src="/products/cattle-guard-hero.png"
            alt="Concrete cattle guard installed at a ranch entrance with cattle behind a gate"
            className="h-full min-h-[420px] w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
              Practical applications
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">
              Built for Real Ranch, Farm, and Rural Access Problems
            </h2>
            <p className="mt-4 text-lg leading-8 text-neutral-700">
              Cattle Guard Forms are ideal for landowners who need dependable livestock control without the cost and complexity of traditional steel cattle guards.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {applications.map((application) => (
              <article key={application.title} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-green-800">{application.title}</h3>
                <p className="mt-3 leading-7 text-neutral-700">{application.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
            Why CowStop
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">
            A Smarter Alternative to Buying and Shipping Steel Guards
          </h2>
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            Traditional steel cattle guards are heavy, expensive to fabricate, and costly to ship. CowStop gives you a reusable form system that helps you create concrete cattle guard sections where you need them, when you need them.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-neutral-900">✓ {benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-green-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-200">
              Watch the CowStop overview
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              See How the CowStop Form Helps You Build Your Own Cattle Guard
            </h2>
            <p className="mt-5 text-lg leading-8 text-green-50">
              Watch the video to better understand how the CowStop reusable form works and why it can be a practical, cost-saving option for ranch entrances, pasture crossings, private roads, and rural access points.
            </p>
            <a
              href="https://www.youtube.com/watch?v=eX8Fn9XYUQw"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded bg-white px-5 py-3 font-semibold text-green-900 hover:bg-green-50"
            >
              Open video on YouTube
            </a>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/20 bg-black shadow-lg">
            <iframe
              className="h-full w-full"
              src="https://www.youtube-nocookie.com/embed/eX8Fn9XYUQw"
              title="CowStop reusable cattle guard form video"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl bg-neutral-950 px-6 py-10 text-white md:px-10">
          <h2 className="text-3xl font-bold tracking-tight">Ready to Build Smarter?</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-200">
            Stop paying extra for oversized steel shipments and start building cattle guards on your terms. Request CowStop information, choose your quantity, and let us help you move your operation forward.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quote"
              className="inline-flex justify-center rounded bg-white px-6 py-3 font-semibold text-neutral-950 hover:bg-neutral-100"
            >
              Request a CowStop Quote
            </Link>
            <Link
              href="/installations"
              className="inline-flex justify-center rounded border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Review Installation Steps
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
