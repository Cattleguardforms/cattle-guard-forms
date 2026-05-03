"use client";

export default function PrintPageButton({ label = "Print Here" }: { label?: string }) {
  function handleClick() {
    globalThis.print();
  }

  return (
    <button type="button" onClick={handleClick} className="rounded bg-green-800 px-5 py-3 text-sm font-black text-white hover:bg-green-900 print:hidden">
      {label}
    </button>
  );
}
