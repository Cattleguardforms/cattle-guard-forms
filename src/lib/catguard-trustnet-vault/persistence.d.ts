export function toReceiptInsert(receipt: import('./types').CatGuardReceipt): Record<string, unknown>;
export function toLineageInsert(lineage: import('./types').CatGuardLineageRecord): Record<string, unknown>;
export function assertPersistableIntegratedResult(
  result: import('./types').CatGuardIntegrationResult
): { ok: true } | { ok: false; error: string };
export function persistCatGuardReceiptAndLineage(
  supabase: { from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error?: unknown }> } },
  result: import('./types').CatGuardIntegrationResult
): Promise<{ ok: true; receipt_id: string; lineage_id: string } | { ok: false; error: string }>;
