export function getNeroaDatabaseUrl() {
  return process.env.NEXT_PUBLIC_NEROA_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getNeroaDatabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_NEROA_DATABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_NEROA_DATABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getNeroaDatabaseServiceRoleKey() {
  return process.env.NEROA_DATABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getNeroaDatabaseBrowserEnv() {
  const databaseUrl = getNeroaDatabaseUrl();
  const databaseKey = getNeroaDatabasePublicKey();

  if (!databaseUrl || !databaseKey) {
    throw new Error(
      "Missing Neroa database browser environment variables. Set NEXT_PUBLIC_NEROA_DATABASE_URL and NEXT_PUBLIC_NEROA_DATABASE_PUBLISHABLE_KEY. Legacy NEXT_PUBLIC_SUPABASE_* variables remain supported as fallbacks."
    );
  }

  return { databaseUrl, databaseKey };
}

export function getNeroaDatabaseServerEnv(
  { requireServiceRole = false }: { requireServiceRole?: boolean } = {}
) {
  const databaseUrl = getNeroaDatabaseUrl();
  const publicKey = getNeroaDatabasePublicKey();
  const serviceRoleKey = getNeroaDatabaseServiceRoleKey();
  const databaseKey = requireServiceRole ? serviceRoleKey : serviceRoleKey || publicKey;

  if (!databaseUrl || !databaseKey) {
    throw new Error(
      requireServiceRole
        ? "Missing Neroa database server environment variables. Set NEXT_PUBLIC_NEROA_DATABASE_URL and NEROA_DATABASE_SERVICE_ROLE_KEY. Legacy Supabase-named variables remain supported as fallbacks."
        : "Missing Neroa database server environment variables. Set NEXT_PUBLIC_NEROA_DATABASE_URL and a Neroa public or service-role key. Legacy Supabase-named variables remain supported as fallbacks."
    );
  }

  return { databaseUrl, databaseKey, hasServiceRoleKey: Boolean(serviceRoleKey) };
}
