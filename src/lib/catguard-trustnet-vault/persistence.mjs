const RECEIPTS_TABLE = 'catguard_trustnet_receipts';
const LINEAGE_TABLE = 'catguard_vault_lineage_records';

function serializeError(error) {
  if (!error) return 'Unknown persistence error.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return JSON.stringify(error);
}

export function toReceiptInsert(receipt) {
  return {
    receipt_id: receipt.receipt_id,
    event_id: receipt.event_id,
    event_type: receipt.event_type,
    from_address: receipt.from_address,
    to_address: receipt.to_address,
    actor_type: receipt.actor_type,
    actor_id: receipt.actor_id,
    form_id: receipt.form_id ?? null,
    submission_id: receipt.submission_id ?? null,
    customer_id: receipt.customer_id ?? null,
    business_id: receipt.business_id ?? null,
    workspace_id: receipt.workspace_id ?? null,
    project_id: receipt.project_id ?? null,
    payload_hash: receipt.payload_hash,
    receipt_hash: receipt.receipt_hash,
    payload_redaction_class: receipt.payload_redaction_class,
    evidence_refs: receipt.evidence_refs ?? [],
    source_refs: receipt.source_refs ?? [],
    approval_refs: receipt.approval_refs ?? [],
    vault_lineage_refs: receipt.vault_lineage_refs ?? [],
    policy_result: receipt.policy_result,
    policy_checks: receipt.policy_checks ?? [],
    previous_event_hash: receipt.previous_event_hash ?? null,
    blocked_reason: receipt.blocked_reason ?? null,
    auth_status: receipt.auth_status ?? null,
    signature_status: receipt.signature_status ?? null,
    timestamp: receipt.timestamp,
    security_class: receipt.security_class,
    retention_class: receipt.retention_class,
  };
}

export function toLineageInsert(lineage) {
  return {
    lineage_id: lineage.lineage_id,
    repo: lineage.repo,
    system_name: lineage.system_name,
    module_name: lineage.module_name ?? null,
    action_id: lineage.action_id,
    event_id: lineage.event_id ?? null,
    receipt_id: lineage.receipt_id,
    memory_refs: lineage.memory_refs ?? [],
    source_refs: lineage.source_refs ?? [],
    decision_refs: lineage.decision_refs ?? [],
    approval_refs: lineage.approval_refs ?? [],
    evidence_refs: lineage.evidence_refs ?? [],
    prompt_refs: lineage.prompt_refs ?? [],
    customer_refs: lineage.customer_refs ?? [],
    business_refs: lineage.business_refs ?? [],
    form_refs: lineage.form_refs ?? [],
    submission_refs: lineage.submission_refs ?? [],
    field_refs: lineage.field_refs ?? [],
    attachment_refs: lineage.attachment_refs ?? [],
    signature_refs: lineage.signature_refs ?? [],
    validation_refs: lineage.validation_refs ?? [],
    receipt_refs: lineage.receipt_refs ?? [],
    trustnet_receipt_refs: lineage.trustnet_receipt_refs ?? [],
    policy_refs: lineage.policy_refs ?? [],
    scan_refs: lineage.scan_refs ?? [],
    redaction_class: lineage.redaction_class,
    retention_class: lineage.retention_class,
    created_at: lineage.created_at,
    created_by_actor: lineage.created_by_actor,
    payload_hash: lineage.payload_hash,
    notes: lineage.notes ?? null,
    summary: lineage.summary ?? null,
  };
}

export function assertPersistableIntegratedResult(result) {
  if (!result || !result.receipt || !result.lineage) {
    return { ok: false, error: 'TrustNet/Vault result is missing receipt or lineage.' };
  }
  if (result.receipt.policy_result !== 'allowed') {
    return { ok: false, error: result.blocked_reason || 'Blocked TrustNet receipt cannot be persisted as a successful action.' };
  }
  if (!result.receipt.receipt_id || !result.lineage.lineage_id) {
    return { ok: false, error: 'Receipt id and lineage id are required for persistence.' };
  }
  if (result.lineage.receipt_id !== result.receipt.receipt_id) {
    return { ok: false, error: 'Lineage receipt_id must match receipt receipt_id.' };
  }
  const linked = Array.isArray(result.lineage.trustnet_receipt_refs)
    && result.lineage.trustnet_receipt_refs.some((ref) => ref.id === result.receipt.receipt_id);
  if (!linked) {
    return { ok: false, error: 'Lineage must include trustnet_receipt_refs for the receipt.' };
  }
  return { ok: true };
}

export async function persistCatGuardReceiptAndLineage(supabase, result) {
  const persistable = assertPersistableIntegratedResult(result);
  if (!persistable.ok) return { ok: false, error: persistable.error };

  const receiptRow = toReceiptInsert(result.receipt);
  const lineageRow = toLineageInsert(result.lineage);

  const { error: receiptError } = await supabase.from(RECEIPTS_TABLE).insert(receiptRow);
  if (receiptError) {
    return { ok: false, error: `TrustNet receipt persistence failed: ${serializeError(receiptError)}` };
  }

  const { error: lineageError } = await supabase.from(LINEAGE_TABLE).insert(lineageRow);
  if (lineageError) {
    return { ok: false, error: `Vault lineage persistence failed: ${serializeError(lineageError)}` };
  }

  return {
    ok: true,
    receipt_id: result.receipt.receipt_id,
    lineage_id: result.lineage.lineage_id,
  };
}
