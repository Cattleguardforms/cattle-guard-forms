import Link from "next/link";

export const metadata = {
  title: "CowStop Warranty Information | Cattle Guard Forms",
  description:
    "Printable CowStop warranty and customer support information sheet for distributors and customers.",
};

export default function WarrantyPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950 print:bg-white print:px-0 print:py-0">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200 print:rounded-none print:p-8 print:shadow-none print:ring-0">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between print:border-neutral-400">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-green-800">Cattle Guard Forms</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">CowStop Warranty & Support Information</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">
              Please keep this sheet with your order records. Customer information is collected so Cattle Guard Forms can maintain warranty records, product traceability, and future support history for each CowStop order.
            </p>
          </div>
          <Link href="/" className="text-sm font-bold text-green-800 print:hidden">
            Back to site
          </Link>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 p-5 print:border-neutral-400">
            <h2 className="text-xl font-bold">Why customer information is required</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              The customer name and phone number are required for warranty records and product traceability. This helps Cattle Guard Forms identify the correct order if there is ever a product, installation, shipping, or support issue.
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Customer email is optional, but helpful if warranty or support communication is needed later.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-5 print:border-neutral-400">
            <h2 className="text-xl font-bold">What to keep with this sheet</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-700">
              <li>Customer name and phone number</li>
              <li>Distributor order confirmation</li>
              <li>Bill of lading or freight documents</li>
              <li>Delivery photos, if available</li>
              <li>Installation date and project location</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-green-100 bg-green-50 p-5 print:border-neutral-400 print:bg-white">
          <h2 className="text-xl font-bold text-green-950">Warranty record fields</h2>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-bold">Customer name</p>
              <div className="mt-2 h-10 rounded border border-neutral-300 bg-white" />
            </div>
            <div>
              <p className="font-bold">Customer phone</p>
              <div className="mt-2 h-10 rounded border border-neutral-300 bg-white" />
            </div>
            <div>
              <p className="font-bold">Customer email optional</p>
              <div className="mt-2 h-10 rounded border border-neutral-300 bg-white" />
            </div>
            <div>
              <p className="font-bold">Distributor / dealer</p>
              <div className="mt-2 h-10 rounded border border-neutral-300 bg-white" />
            </div>
            <div>
              <p className="font-bold">Order number</p>
              <div className="mt-2 h-10 rounded border border-neutral-300 bg-white" />
            </div>
            <div>
              <p className="font-bold">Delivery / installation location</p>
              <div className="mt-2 h-10 rounded border border-neutral-300 bg-white" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 p-5 print:border-neutral-400">
            <h2 className="text-xl font-bold">If support is needed</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Contact the distributor where the CowStop form was purchased first. If the issue requires Cattle Guard Forms support, please include the customer name, distributor name, order number, delivery location, and photos of the product or installation area.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-5 print:border-neutral-400">
            <h2 className="text-xl font-bold">Freight and delivery notes</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Keep all freight documents, including the original BOL, signed BOL, tracking information, and delivery photos. These records may be needed for shipping support or warranty review.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 print:border-neutral-400 print:bg-white">
          <p className="font-bold">Important</p>
          <p className="mt-2">
            This sheet is a customer-support and warranty-record document. It does not replace the invoice, bill of lading, distributor agreement, or any written warranty terms provided separately by Cattle Guard Forms.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="rounded bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900"
          >
            Print warranty sheet
          </button>
          <Link href="/distributor/order-portal" className="rounded border border-green-800 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">
            Distributor order portal
          </Link>
        </div>
      </section>
    </main>
  );
}
