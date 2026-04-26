export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublicKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getSupabaseBrowserEnv() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase browser environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function getSupabaseServerEnv({ requireServiceRole = false }: { requireServiceRole?: boolean } = {}) {
  const supabaseUrl = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const supabaseKey = requireServiceRole ? serviceRoleKey : serviceRoleKey || publicKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      requireServiceRole
        ? "Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        : "Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL and a Supabase public or service-role key."
    );
  }

  return { supabaseUrl, supabaseKey, hasServiceRoleKey: Boolean(serviceRoleKey) };
}
