import { createClient } from "@supabase/supabase-js";
import { getNeroaDatabaseBrowserEnv } from "./env";

const { databaseUrl, databaseKey } = getNeroaDatabaseBrowserEnv();

/**
 * Neroa browser database client.
 * @supabase/supabase-js is the transport SDK only; the configured backend is Neroa.
 */
export const neroaDatabaseClient = createClient(databaseUrl, databaseKey);
