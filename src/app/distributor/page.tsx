import Link from "next/link";

export const metadata = {
  title: "CowStop Distributor Access | Cattle Guard Forms",
  description:
    "Request approved distributor access for CowStop reusable cattle guard forms. Authorized distributors can contact Cattle Guard Forms for account setup, freight review, and order support.",
};

function Header() {
  return (
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
            Install
          </Link>
          <Link href="/faq" className="hover:text-green-800">
            FAQ
          </Link>
          <Link href="/contact" className="text-green-800">
            Contact
          </Link>
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
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
            Distributor access
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            CowStop distributor access is by approval only.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-700">
            Cattle Guard Forms works with approved distributor accounts for CowStop reusable concrete cattle guard forms. Distributor ordering, pricing, payment, freight paperwork, and fulfillment tools are available only after account approval and secure sign-in setup.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
            If you are an existing distributor or want to apply for distributor access, contact support and include your company name, contact information, service area, and expected order volume. Our team will review the account and confirm the next step.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact?topic=Distributor%20Access"
              className="inline-flex justify-center rounded bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900"
            >
              Request Distributor Access
            </Link>
            <Link
              href="/quote"
              className="inline-flex justify-center rounded border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-950 hover:bg-neutral-50"
            >
              Shop CowStop Forms
            </Link>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Authorized access only</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Distributor accounts are reviewed before portal access is enabled. Sign-in links and ordering tools are provided directly to approved accounts.
            </p>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-2xl font-semibold">Freight and fulfillment</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Freight quote and fulfillment details are confirmed after order review. Shipping documents and production coordination are handled through approved account workflows.
            </p>
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
