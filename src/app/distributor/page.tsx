import Link from "next/link";

export const metadata = {
  title: "CowStop Distributor Access | Cattle Guard Forms",
  description:
    "Request approved distributor access or sign in to the CowStop distributor order portal for reusable cattle guard form ordering and support.",
};

function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center">
          <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
          <Link href="/" className="hover:text-green-800">Home</Link>
          <Link href="/quote" className="hover:text-green-800">Shop</Link>
          <Link href="/installations" className="hover:text-green-800">Install</Link>
          <Link href="/faq" className="hover:text-green-800">FAQ</Link>
          <Link href="/distributor" className="text-green-800">Distributor</Link>
          <Link href="/contact" className="hover:text-green-800">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export default function DistributorPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <Header />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Distributor access</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            CowStop distributor access is by approval only.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-700">
            Approved distributor accounts can sign in to one clean order portal for CowStop orders, Cattle Guard Forms freight quotes, or distributor-arranged freight with BOL upload.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
            If you are an existing distributor, use the order portal below. If you want to apply for distributor access, contact support and include your company name, contact information, service area, and expected order volume.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/distributor/order-portal" className="inline-flex justify-center rounded bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900">
              Distributor Order Portal
            </Link>
            <Link href="/contact?topic=Distributor%20Access" className="inline-flex justify-center rounded border border-green-800 bg-white px-6 py-3 font-semibold text-green-900 hover:bg-green-50">
              Request Distributor Access
            </Link>
            <Link href="/quote" className="inline-flex justify-center rounded border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-950 hover:bg-neutral-50">
              Shop CowStop Forms
            </Link>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Approved distributor order portal</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Approved accounts can order CowStop forms, choose CGF freight or distributor-arranged freight, and upload BOL documents in one portal.
            </p>
            <Link href="/distributor/order-portal" className="mt-4 inline-flex font-semibold text-green-800 hover:text-green-900">
              Open distributor order portal →
            </Link>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Need help now?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Existing distributors can contact support for account access, order questions, payment support, and freight review.
            </p>
            <Link href="/contact" className="mt-4 inline-flex font-semibold text-green-800 hover:text-green-900">
              Contact support →
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
