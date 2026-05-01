"use client";

export default function PrintButton({ label = "Download / Save PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900 print:hidden"
    >
      {label}
    </button>
  );
}
