declare module '@/lib/catguard-trustnet-vault/index.mjs' {
  export function stableStringify(value: unknown): string;
  export function hashPayload(payload: unknown): string;
  export function createCatGuardTrustNetReceipt(
    context: import('@/lib/catguard-trustnet-vault/types').CatGuardActionContext
  ): import('@/lib/catguard-trustnet-vault/types').CatGuardReceipt;
  export function createCatGuardVaultLineageRecord(
    context: import('@/lib/catguard-trustnet-vault/types').CatGuardActionContext,
    receipt: import('@/lib/catguard-trustnet-vault/types').CatGuardReceipt
  ): import('@/lib/catguard-trustnet-vault/types').CatGuardLineageRecord;
  export function emitCatGuardFormActionWithReceiptAndLineage(
    context: import('@/lib/catguard-trustnet-vault/types').CatGuardActionContext
  ): import('@/lib/catguard-trustnet-vault/types').CatGuardIntegrationResult;
}

declare module '@/lib/catguard-trustnet-vault/persistence.mjs' {
  type CatGuardInsertResult = PromiseLike<{ error?: unknown }>;
  type CatGuardPersistenceClient = {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => CatGuardInsertResult;
    };
  };

  export function toReceiptInsert(
    receipt: import('@/lib/catguard-trustnet-vault/types').CatGuardReceipt
  ): Record<string, unknown>;
  export function toLineageInsert(
    lineage: import('@/lib/catguard-trustnet-vault/types').CatGuardLineageRecord
  ): Record<string, unknown>;
  export function assertPersistableIntegratedResult(
    result: import('@/lib/catguard-trustnet-vault/types').CatGuardIntegrationResult
  ): { ok: true } | { ok: false; error: string };
  export function persistCatGuardReceiptAndLineage(
    supabase: CatGuardPersistenceClient,
    result: import('@/lib/catguard-trustnet-vault/types').CatGuardIntegrationResult
  ): Promise<{ ok: true; receipt_id: string; lineage_id: string } | { ok: false; error: string }>;
}
