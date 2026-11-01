import {
  getNeroaDatabaseBrowserEnv,
  getNeroaDatabasePublicKey,
  getNeroaDatabaseServerEnv,
  getNeroaDatabaseServiceRoleKey,
  getNeroaDatabaseUrl,
} from "@/lib/neroa-db/env";

/**
 * Legacy compatibility wrappers.
 * Neroa is the canonical database name for this application.
 */
export function getSupabaseUrl() {
  return getNeroaDatabaseUrl();
}

export function getSupabasePublicKey() {
  return getNeroaDatabasePublicKey();
}

export function getSupabaseServiceRoleKey() {
  return getNeroaDatabaseServiceRoleKey();
}

export function getSupabaseBrowserEnv() {
  const { databaseUrl, databaseKey } = getNeroaDatabaseBrowserEnv();
  return { supabaseUrl: databaseUrl, supabaseKey: databaseKey };
}

export function getSupabaseServerEnv(options: { requireServiceRole?: boolean } = {}) {
  const { databaseUrl, databaseKey, hasServiceRoleKey } = getNeroaDatabaseServerEnv(options);
  return { supabaseUrl: databaseUrl, supabaseKey: databaseKey, hasServiceRoleKey };
}
