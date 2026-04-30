import DistributorNav from "../DistributorNav";
import DistributorOrderPortal from "../order-portal/page";

export default function DistributorShopPage() {
  return (
    <>
      <div className="bg-neutral-50 px-6 pt-6 text-neutral-950">
        <section className="mx-auto max-w-6xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p>
          <h1 className="mt-1 text-2xl font-black">Shop</h1>
          <p className="mt-2 text-sm text-neutral-700">Place a new CowStop order here. Use Home for open orders, past orders, documents, and support.</p>
          <DistributorNav active="shop" />
        </section>
      </div>
      <DistributorOrderPortal />
    </>
  );
}
