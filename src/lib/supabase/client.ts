import { neroaDatabaseClient } from "@/lib/neroa-db/client";

/**
 * Legacy compatibility alias.
 * New code should use neroaDatabaseClient.
 */
export const supabaseClient = neroaDatabaseClient;
