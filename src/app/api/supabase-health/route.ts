import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getNeroaDatabasePublicKey,
  getNeroaDatabaseServiceRoleKey,
  getNeroaDatabaseUrl,
} from "@/lib/neroa-db/env";

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

async function countTable(database: SupabaseClient, table: "customers" | "orders") {
  try {
    const { count, error } = await database.from(table).select("*", { count: "exact", head: true });

    if (error) {
      return { ok: false, count: null, blocker: classifyError(error), error: error.message };
    }

    return { ok: true, count: count ?? 0, blocker: null, error: null };
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
  return blockers.find(Boolean) ?? null;
}

export async function GET() {
  const databaseUrl = getNeroaDatabaseUrl();
  const databaseKey = getNeroaDatabasePublicKey();
  const serviceRoleKey = getNeroaDatabaseServiceRoleKey();

  const env = {
    backend: "neroa",
    hasDatabaseUrl: Boolean(databaseUrl),
    hasPublicKey: Boolean(databaseKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    usingLegacySupabaseNames: Boolean(
      !process.env.NEXT_PUBLIC_NEROA_DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
  };

  if (!databaseUrl || !databaseKey) {
    return NextResponse.json(
      {
        ok: false,
        blocker: "missing_env",
        env,
        customers: { ok: false, count: null, blocker: "missing_env", error: "Missing Neroa database URL or public key." },
        orders: { ok: false, count: null, blocker: "missing_env", error: "Missing Neroa database URL or public key." },
        errors: ["Missing Neroa database configuration."],
      },
      { status: 500 }
    );
  }

  const database = createClient(databaseUrl, databaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [customers, orders] = await Promise.all([
    countTable(database, "customers"),
    countTable(database, "orders"),
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
      backend: "neroa",
      blocker,
      env,
      customers,
      orders,
      errors,
    },
    { status: ok ? 200 : 500 }
  );
}
