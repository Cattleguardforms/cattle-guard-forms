import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerEnv } from "./env";

export function createSupabaseServerClient() {
  const settings = getSupabaseServerEnv();
  return createClient(settings.supabaseUrl, settings.supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const settings = getSupabaseServerEnv({ requireServiceRole: true });
  return createClient(settings.supabaseUrl, settings.supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
