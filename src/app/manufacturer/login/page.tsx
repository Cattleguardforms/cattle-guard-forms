"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default function ManufacturerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!supabase) throw new Error("Manufacturer sign-in is not available.");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw new Error("Invalid manufacturer credentials.");
      window.location.href = "/manufacturer";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <Link href="/" className="text-sm font-semibold text-green-800">Back to Cattle Guard Forms</Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Manufacturer Portal</p>
        <h1 className="mt-2 text-3xl font-black">Manufacturer Sign In</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Sign in to view fulfillment orders, download original BOLs, and upload signed BOLs.
        </p>
        {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        <form onSubmit={signIn} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border px-3 py-2 font-normal" placeholder="customerservice@meeseinc.com" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Password
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border px-3 py-2 font-normal" />
          </label>
          <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-bold text-white disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <Link href="/manufacturer/forgot-password" className="text-sm font-bold text-green-800 hover:text-green-900">Forgot password?</Link>
        </form>
      </section>
    </main>
  );
}
