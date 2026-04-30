import Link from "next/link";

const portals = [
  {
    title: "Admin Portal",
    href: "/admin",
    description: "Business command center for orders, distributors, CRM activity, analytics, and settings.",
  },
  {
    title: "Distributor Order Portal",
    href: "/distributor/order-portal",
    description: "Approved distributor ordering for CowStop forms, CGF freight quotes, own-freight BOL upload, and distributor pricing.",
  },
  {
    title: "Manufacturer Portal",
    href: "/manufacturer",
    description: "Manufacturer fulfillment workflow for reviewing CowStop orders and replying with structured shipping updates.",
  },
  {
    title: "Marketing Portal",
    href: "/marketing",
    description: "Marketing, CRM, email composer, AI content, blog planning, and campaign workspace.",
  },
];

export default function PortalsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-14 w-auto object-contain" />
            <span className="hidden text-lg font-black uppercase leading-5 tracking-wide text-green-900 sm:block">
              Cattle Guard<br />Forms
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">Main Site</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Cattle Guard Forms portals</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Portal Access</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
          Use this page as the canonical connection point between the public website and the active internal portals. Distributor ordering now routes through the clean Distributor Order Portal.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-1 hover:ring-green-800"
            >
              <h2 className="text-xl font-semibold text-green-950">{portal.title}</h2>
              <p className="mt-3 min-h-24 text-sm leading-6 text-neutral-600">{portal.description}</p>
              <span className="mt-5 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white">
                Open {portal.title}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
          Canonical routes: Admin Portal = /admin, Distributor Order Portal = /distributor/order-portal, Manufacturer Portal = /manufacturer, Marketing Portal = /marketing. Old /reseller traffic redirects to /distributor.
        </div>
      </section>
    </main>
  );
}
