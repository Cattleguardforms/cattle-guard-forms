import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envPath = ".env.local";
const env = {};

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, "");
    env[key] = value;
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = publishableKey || anonKey;

function classifyError(error) {
  const message = error?.message ? String(error.message) : String(error ?? "");
  const code = error?.code ? String(error.code) : "";
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

async function countTable(supabase, table) {
  try {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });

    if (error) {
      return {
        ok: false,
        count: null,
        blocker: classifyError(error),
        errorCode: error.code ?? null,
        errorMessage: error.message ?? String(error),
      };
    }

    return {
      ok: true,
      count: count ?? 0,
      blocker: null,
      errorCode: null,
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false,
      count: null,
      blocker: classifyError(error),
      errorCode: error?.code ?? null,
      errorMessage: error?.message ? String(error.message) : String(error),
    };
  }
}

function chooseBlocker(blockers) {
  return blockers.find(Boolean) ?? null;
}

const result = {
  ok: false,
  env: {
    hasEnvFile: existsSync(envPath),
    hasUrl: Boolean(supabaseUrl),
    hasPublishableKey: Boolean(publishableKey),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
  },
  customers: { ok: false, count: null, blocker: null, errorCode: null, errorMessage: null },
  orders: { ok: false, count: null, blocker: null, errorCode: null, errorMessage: null },
  errors: [],
  blocker: null,
};

if (!supabaseUrl || !supabaseKey) {
  result.blocker = "missing_env";
  result.customers = { ok: false, count: null, blocker: "missing_env", errorCode: null, errorMessage: "Missing Supabase URL or public key." };
  result.orders = { ok: false, count: null, blocker: "missing_env", errorCode: null, errorMessage: "Missing Supabase URL or public key." };
  result.errors.push("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [customers, orders] = await Promise.all([
  countTable(supabase, "customers"),
  countTable(supabase, "orders"),
]);

result.customers = customers;
result.orders = orders;
result.ok = customers.ok && orders.ok;
result.blocker = result.ok ? null : chooseBlocker([customers.blocker, orders.blocker]);
result.errors = [
  customers.errorMessage ? `customers: ${customers.errorMessage}` : null,
  orders.errorMessage ? `orders: ${orders.errorMessage}` : null,
].filter(Boolean);

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
