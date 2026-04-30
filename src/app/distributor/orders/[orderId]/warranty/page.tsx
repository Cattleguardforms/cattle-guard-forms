"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DistributorNav from "../../../DistributorNav";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type WarrantyPayload = {
  ok?: boolean;
  error?: string;
  order?: {
    id: string;
    shortId: string;
    distributorName: string;
    productName: string;
    quantity: number;
    createdAt: string;
    paymentStatus: string;
    shipmentStatus: string;
    shipToName: string;
    shipToAddress: string;
  };
  warranty?: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
};

export default function OrderWarrantyPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const supabase = useMemo(() => (supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null), []);
  const [payload, setPayload] = useState<WarrantyPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWarranty() {
      try {
        if (!supabase) throw new Error("Distributor auth unavailable.");
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Distributor sign-in is required.");
        const response = await fetch(`/api/distributor/order-warranty?orderId=${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nextPayload = (await response.json()) as WarrantyPayload;
        if (!response.ok || !nextPayload.ok) throw new Error(nextPayload.error || "Unable to load warranty paperwork.");
        setPayload(nextPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load warranty paperwork.");
      }
    }
    void loadWarranty();
  }, [orderId, supabase]);

  if (error) return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950"><section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"><Link href="/distributor/home" className="text-sm font-semibold text-green-800">Back to Distributor Home</Link><div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div></section></main>;
  if (!payload?.order) return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">Loading warranty paperwork...</main>;

  return <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950 print:bg-white print:px-0 print:py-0"><section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200 print:rounded-none print:shadow-none print:ring-0"><Link href="/distributor/home" className="text-sm font-semibold text-green-800 print:hidden">Back to Distributor Home</Link><p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Cattle Guard Forms</p><h1 className="mt-2 text-3xl font-black">CowStop Warranty Paperwork</h1><p className="mt-3 text-sm leading-6 text-neutral-700">Order-specific customer warranty and support record. Print or save this page for the customer and keep a copy with the order record.</p><div className="print:hidden"><DistributorNav active="documents" /></div><div className="mt-6 print:hidden"><button type="button" onClick={() => window.print()} className="rounded bg-green-800 px-5 py-3 font-bold text-white">Print / Save as PDF</button></div><section className="mt-8 grid gap-5 md:grid-cols-2"><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"><h2 className="text-xl font-black text-green-950">Customer Warranty Information</h2><p className="mt-3 text-sm"><span className="font-bold">Customer name:</span> {payload.warranty?.customerName || "Not provided"}</p><p className="mt-2 text-sm"><span className="font-bold">Customer phone:</span> {payload.warranty?.customerPhone || "Not provided"}</p><p className="mt-2 text-sm"><span className="font-bold">Customer email:</span> {payload.warranty?.customerEmail || "Not provided"}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"><h2 className="text-xl font-black text-green-950">Order Information</h2><p className="mt-3 text-sm"><span className="font-bold">Order:</span> {payload.order.shortId}</p><p className="mt-2 text-sm"><span className="font-bold">Product:</span> {payload.order.productName}</p><p className="mt-2 text-sm"><span className="font-bold">Quantity:</span> {payload.order.quantity}</p><p className="mt-2 text-sm"><span className="font-bold">Distributor:</span> {payload.order.distributorName}</p><p className="mt-2 text-sm"><span className="font-bold">Ship-to:</span> {payload.order.shipToName} {payload.order.shipToAddress}</p></div></section><section className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5 print:border-neutral-400 print:bg-white"><h2 className="text-xl font-bold text-green-950">CowStop material and construction</h2><p className="mt-3 text-sm leading-6 text-green-950">CowStop forms are manufactured from high-density polyethylene (HDPE). The form is foam-filled / foam-supported so it can hold its shape for normal concrete forming use.</p><p className="mt-3 text-sm leading-6 text-green-950">HDPE is durable and reusable, but it is not indestructible. Damage caused by handling, freight, jobsite equipment, dragging, crushing, cutting, drilling, burning, improper storage, or use outside normal CowStop forming applications is not considered a manufacturer defect.</p></section><section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 print:border-neutral-400 print:bg-white"><h2 className="text-xl font-bold text-red-950">Limited warranty claim requirements</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-red-950"><li>Warranty coverage is limited to manufacturer defects only.</li><li>Any suspected manufacturer defect must be reported within 30 days of receiving the CowStop form.</li><li>Photos of the form and claimed damage must be submitted before any warranty claim can be reviewed.</li><li>The warranty claim must be reviewed and approved by Cattle Guard Forms before any return is accepted.</li><li>If return inspection is required, the customer is responsible for freight back to the Cattle Guard Forms manufacturing facility.</li><li>If excessive use, misuse, jobsite damage, freight damage, modification, or improper handling is visible on the form, the warranty claim may be denied.</li></ul></section></section></main>;
}
