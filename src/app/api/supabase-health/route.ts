import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Blocker =
  | "missing_env"
  | "network_fetch_failed"
  | "wrong_url_or_key"
  | "table_does_not_exist"
  | "rls_policy_denied"
  | "unknown_error"
  | null;

function classifyError(error: unknown): Blocker {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error ?? "");

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  const lower = `${code} ${message}`.toLowerCase();

  if (lower.includes("fetch failed") || lower.includes("enotfound") || lower.includes("enetunreach") || lower.includes("econnrefused")) {
    return "network_fetch_failed";
  }

  if (lower.includes("invalid api key") || lower.includes("jwt") || lower.includes("unauthorized") || lower.includes("401")) {
    return "wrong_url_or_key";
  }

  if (code === "42P01" || lower.includes("does not exist") || lower.includes("relation") || lower.includes("not found")) {
    return "table_does_not_exist";
  }

  if (lower.includes("row-level security") || lower.includes("permission denied") || lower.includes("policy") || lower.includes("403")) {
    return "rls_policy_denied";
  }

  return "unknown_error";
}

async function countTable(supabase: ReturnType<typeof createClient>, table: "customers" | "orders") {
  try {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });

    if (error) {
      return {
        ok: false,
        count: null,
        blocker: classifyError(error),
        error: error.message,
      };
    }

    return {
      ok: true,
      count: count ?? 0,
      blocker: null,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      count: null,
      blocker: classifyError(error),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function chooseBlocker(blockers: Blocker[]): Blocker {
  const first = blockers.find(Boolean);
  return first ?? null;
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = publishableKey || anonKey;

  const env = {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasPublishableKey: Boolean(publishableKey),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
  };

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        blocker: "missing_env",
        env,
        customers: { ok: false, count: null, blocker: "missing_env", error: "Missing Supabase URL or public key." },
        orders: { ok: false, count: null, blocker: "missing_env", error: "Missing Supabase URL or public key." },
        errors: ["Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."],
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [customers, orders] = await Promise.all([
    countTable(supabase, "customers"),
    countTable(supabase, "orders"),
  ]);

  const ok = customers.ok && orders.ok;
  const blocker = ok ? null : chooseBlocker([customers.blocker, orders.blocker]);
  const errors = [
    customers.error ? `customers: ${customers.error}` : null,
    orders.error ? `orders: ${orders.error}` : null,
  ].filter(Boolean);

  return NextResponse.json(
    {
      ok,
      blocker,
      env,
      customers,
      orders,
      errors,
    },
    { status: ok ? 200 : 500 }
  );
}
