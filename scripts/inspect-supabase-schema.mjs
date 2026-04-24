import { readFileSync, existsSync } from "node:fs";

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
const supabaseKey = publishableKey || anonKey;

const result = {
  ok: false,
  env: {
    hasEnvFile: existsSync(envPath),
    hasUrl: Boolean(supabaseUrl),
    hasPublishableKey: Boolean(publishableKey),
    hasAnonKey: Boolean(anonKey),
  },
  customers: null,
  orders: null,
  errors: [],
};

function safeError(error) {
  return error?.message ? String(error.message) : String(error ?? "unknown error");
}

function extractTable(openapi, tableName) {
  const definitions = openapi?.definitions || openapi?.components?.schemas || {};
  const schema = definitions[tableName];
  if (!schema) return null;

  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  const properties = schema.properties || {};

  return {
    found: true,
    columns: Object.entries(properties).map(([name, details]) => ({
      name,
      type: details?.type ?? null,
      format: details?.format ?? null,
      nullable: details?.nullable ?? !required.has(name),
      required: required.has(name),
      description: details?.description ?? null,
      default: details?.default ?? null,
    })),
  };
}

if (!supabaseUrl || !supabaseKey) {
  result.errors.push("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

try {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/openapi+json",
    },
  });

  result.httpStatus = response.status;

  if (!response.ok) {
    result.errors.push(`OpenAPI schema request failed with HTTP ${response.status}.`);
    const body = await response.text();
    if (body) result.errors.push(body.slice(0, 500));
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const openapi = await response.json();
  result.customers = extractTable(openapi, "customers") ?? { found: false, columns: [] };
  result.orders = extractTable(openapi, "orders") ?? { found: false, columns: [] };
  result.ok = Boolean(result.customers?.found && result.orders?.found);

  if (!result.customers?.found) result.errors.push("customers schema not found in OpenAPI output.");
  if (!result.orders?.found) result.errors.push("orders schema not found in OpenAPI output.");

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  result.errors.push(safeError(error));
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}
