import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start gap-6 px-6 py-16">
      <p className="rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-widest text-slate-400">
        Foundation Ready
      </p>
      <h1 className="text-4xl font-semibold">Cattle Guard Forms</h1>
      <p className="max-w-2xl text-slate-300">
        Next.js, TypeScript, Tailwind, ESLint, Supabase, and Stripe are wired and
        ready for product features.
      </p>
      <div className="flex gap-4">
        <Link className="underline" href="/about">
          About
        </Link>
        <Link className="underline" href="/forms">
          Forms
        </Link>
      </div>
    </main>
  );
}
