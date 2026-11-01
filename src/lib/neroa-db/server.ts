import { createClient } from "@supabase/supabase-js";
import { getNeroaDatabaseServerEnv } from "./env";

/**
 * Neroa database adapter.
 * @supabase/supabase-js is retained only as the compatible PostgREST/Auth client.
 */
export function createNeroaDatabaseServerClient() {
  const settings = getNeroaDatabaseServerEnv();
  return createClient(settings.databaseUrl, settings.databaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createNeroaDatabaseAdminClient() {
  const settings = getNeroaDatabaseServerEnv({ requireServiceRole: true });
  return createClient(settings.databaseUrl, settings.databaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
