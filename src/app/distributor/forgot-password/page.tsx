"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://cattleguardforms.com").replace(/\/$/, "");
}

export default function DistributorForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, []);

  async function sendReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (!supabase) throw new Error("Password reset is not available right now.");
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !normalizedEmail.includes("@")) throw new Error("Enter a valid distributor email address.");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${siteUrl()}/auth/update-password?next=/distributor/home`,
      });
      if (resetError) throw new Error(resetError.message || "Unable to send password reset email.");
      setNotice("Password reset email sent. Check your inbox for the reset link, then return to the distributor portal to sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <Link href="/distributor/home" className="text-sm font-semibold text-green-800">Back to distributor sign in</Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-800">Distributor Portal</p>
        <h1 className="mt-2 text-3xl font-black">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Enter the email address connected to your approved distributor account. We will send a secure reset link if the email is registered.
        </p>
        {error ? <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div> : null}
        <form onSubmit={sendReset} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Distributor email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border px-3 py-2 font-normal" placeholder="sales@barnworld.com" />
          </label>
          <button disabled={loading} className="rounded bg-green-800 px-5 py-3 font-bold text-white disabled:opacity-50">
            {loading ? "Sending reset email..." : "Send Password Reset Email"}
          </button>
        </form>
      </section>
    </main>
  );
}
