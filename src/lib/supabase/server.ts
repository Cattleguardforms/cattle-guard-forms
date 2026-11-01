import {
  createNeroaDatabaseAdminClient,
  createNeroaDatabaseServerClient,
} from "@/lib/neroa-db/server";

/**
 * Legacy compatibility aliases.
 * New code should import from @/lib/neroa-db/server.
 */
export function createSupabaseServerClient() {
  return createNeroaDatabaseServerClient();
}

export function createSupabaseAdminClient() {
  return createNeroaDatabaseAdminClient();
}
