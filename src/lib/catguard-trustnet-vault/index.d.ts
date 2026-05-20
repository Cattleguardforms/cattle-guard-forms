export * from './types';
export function stableStringify(value: unknown): string;
export function hashPayload(payload: unknown): string;
export function createCatGuardTrustNetReceipt(context: import('./types').CatGuardActionContext): import('./types').CatGuardReceipt;
export function createCatGuardVaultLineageRecord(
  context: import('./types').CatGuardActionContext,
  receipt: import('./types').CatGuardReceipt
): import('./types').CatGuardLineageRecord;
export function emitCatGuardFormActionWithReceiptAndLineage(
  context: import('./types').CatGuardActionContext
): import('./types').CatGuardIntegrationResult;
