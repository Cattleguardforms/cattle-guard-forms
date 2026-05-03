"use client";

import { useEffect, useState } from "react";

type UploadResponse = { ok?: boolean; error?: string; file?: { file_name?: string } };

export default function ManufacturerBolUploadPage() {
  const [orderId, setOrderId] = useState("");
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("orderId") || "");
    setToken(params.get("token") || "");
  }, []);

  async function upload() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!orderId || !token) throw new Error("This upload link is missing required order information.");
      if (!file) throw new Error("Choose a BOL file first.");
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("token", token);
      formData.append("file", file);
      const response = await fetch("/api/manufacturer/upload-bol", { method: "POST", body: formData });
      const payload = (await response.json()) as UploadResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to upload BOL.");
      setSuccess(`BOL uploaded successfully${payload.file?.file_name ? `: ${payload.file.file_name}` : ""}. Shipment notification emails have been triggered.`);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload BOL.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <p className="text-sm font-bold uppercase tracking-wide text-green-800">Manufacturer BOL Upload</p>
        <h1 className="mt-2 text-3xl font-black">Upload Bill of Lading</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Upload the BOL for this Cattle Guard Forms order. Once uploaded, the order will be marked shipped and a shipment email will be sent to the customer/distributor and support.
        </p>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Order ID</p>
          <p className="mt-1 break-words font-mono text-sm font-bold">{orderId || "Missing order ID"}</p>
        </div>

        {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {success ? <div className="mt-5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{success}</div> : null}

        <label className="mt-6 grid gap-2 text-sm font-bold text-neutral-800">
          BOL file
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="rounded border border-neutral-300 bg-white px-3 py-3 font-normal"
          />
        </label>

        <button
          type="button"
          disabled={loading || !file}
          onClick={() => void upload()}
          className="mt-6 w-full rounded bg-green-800 px-5 py-3 font-black text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload BOL and Notify Customer"}
        </button>
      </section>
    </main>
  );
}
