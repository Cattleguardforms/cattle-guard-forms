import { createHash, randomUUID } from 'node:crypto';

export const SUPPORTED_TRUSTNET_EVENTS = new Set([
  'catguard.form.created',
  'catguard.form.updated',
  'catguard.submission.started',
  'catguard.submission.completed',
  'catguard.attachment.uploaded',
  'catguard.attachment.scanned',
  'catguard.approval.required',
  'catguard.approval.recorded',
  'catguard.ai_action.started',
  'catguard.ai_action.completed',
  'catguard.policy.blocked',
]);

export const LINEAGE_EVENT_BY_FAMILY = {
  form: 'catguard.form.linked_to_vault',
  submission: 'catguard.submission.linked_to_vault',
  attachment: 'catguard.attachment.linked_to_vault',
  approval: 'catguard.approval.linked_to_vault',
  ai_action: 'catguard.ai_action.linked_to_vault',
  blocked: 'vault.lineage.policy_blocked',
};

export const REDACTION_CLASSES = new Set([
  'hash_only',
  'metadata_only',
  'redacted_summary',
  'private_internal',
  'customer_safe_projection',
  'raw_sensitive_internal',
]);

export const ADDRESS_TYPES = new Set([
  'catguard_forms_address',
  'form_address',
  'submission_address',
  'field_address',
  'attachment_address',
  'signature_address',
  'approval_address',
  'customer_address',
  'business_address',
  'workspace_address',
  'project_address',
  'actor_address',
  'worker_address',
  'receipt_address',
]);

const FORBIDDEN_BEHAVIOR = [
  'mainnet',
  'gas',
  'wallet',
  'token',
  'custody',
  'bridge',
  'public-chain rpc',
  'private key',
  'credential',
  'secret',
];

const SENSITIVE_FIELD_NAMES = [
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
  'bank_account',
  'routing_number',
  'medical_record',
  'diagnosis',
  'private_key',
  'password',
  'secret',
  'credential',
  'raw_form_contents',
  'raw_attachment',
  'signature_image',
];

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function hashPayload(payload) {
  const stable = typeof payload === 'string' ? payload : stableStringify(payload ?? {});
  return `sha256:${createHash('sha256').update(stable).digest('hex')}`;
}

function refList(value) {
  return Array.isArray(value) ? value.filter((ref) => ref && typeof ref.id === 'string' && ref.id.length > 0) : [];
}

function hasRef(value) {
  return refList(value).length > 0;
}

function validateAddress(address, field, checks) {
  if (!address || typeof address.id !== 'string' || !address.id.trim()) {
    checks.push({ id: field, status: 'blocked', reason: `${field} is required.` });
    return;
  }
  if (!ADDRESS_TYPES.has(address.type)) {
    checks.push({ id: field, status: 'blocked', reason: `${field} has an unknown address type.` });
  }
}

function payloadContainsSensitiveRawData(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const stack = [payload];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    for (const [key, value] of Object.entries(current)) {
      const normalized = key.toLowerCase();
      if (SENSITIVE_FIELD_NAMES.some((name) => normalized.includes(name))) return true;
      if (value && typeof value === 'object') stack.push(value);
    }
  }
  return false;
}

function contextAttemptsForbiddenBehavior(context) {
  const haystack = [context.event_type, context.notes, context.summary, stableStringify(context.payload ?? {})]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return FORBIDDEN_BEHAVIOR.find((word) => haystack.includes(word));
}

function crossesBoundary(refs, context) {
  const customerIds = new Set([context.customer_id].filter(Boolean));
  const workspaceIds = new Set([context.workspace_id].filter(Boolean));
  for (const ref of refList(refs)) {
    if (ref.customer_id && customerIds.size && !customerIds.has(ref.customer_id)) return true;
    if (ref.workspace_id && workspaceIds.size && !workspaceIds.has(ref.workspace_id)) return true;
  }
  return false;
}

function validateContext(context) {
  const checks = [];

  if (!SUPPORTED_TRUSTNET_EVENTS.has(context.event_type)) {
    checks.push({ id: 'event_type', status: 'blocked', reason: 'Unknown or unsupported CatGuard Forms TrustNet event type.' });
  }

  validateAddress(context.from_address, 'from_address', checks);
  validateAddress(context.to_address, 'to_address', checks);

  if (!context.actor_type || !context.actor_id) {
    checks.push({ id: 'actor_identity', status: 'blocked', reason: 'actor_type and actor_id are required.' });
  }

  const payloadHash = context.payload_hash || (context.payload !== undefined ? hashPayload(context.payload) : '');
  if (!payloadHash) {
    checks.push({ id: 'payload_hash', status: 'blocked', reason: 'payload_hash is required or must be derivable from payload.' });
  }

  const redaction = context.payload_redaction_class || context.redaction_class;
  if (!redaction || !REDACTION_CLASSES.has(redaction)) {
    checks.push({ id: 'redaction_class', status: 'blocked', reason: 'A valid payload redaction class is required.' });
  }

  if (!context.retention_class && (redaction === 'private_internal' || redaction === 'raw_sensitive_internal')) {
    checks.push({ id: 'retention_class', status: 'blocked', reason: 'retention_class is required for sensitive data.' });
  }

  if (context.requires_source_ref && !hasRef(context.source_refs)) {
    checks.push({ id: 'source_refs', status: 'blocked', reason: 'Source-backed action requires at least one source_ref.' });
  }

  const approvalRequired = context.requires_approval_ref || context.event_type === 'catguard.approval.required' || context.event_type === 'catguard.approval.recorded';
  if (approvalRequired && !hasRef(context.approval_refs)) {
    checks.push({ id: 'approval_refs', status: 'blocked', reason: 'Approval-required action requires at least one approval_ref.' });
  }

  if (context.requires_signature_ref && !hasRef(context.signature_refs)) {
    checks.push({ id: 'signature_refs', status: 'blocked', reason: 'Signature-required action requires at least one signature_ref.' });
  }

  if (context.requires_attachment_scan && !hasRef(context.scan_refs)) {
    checks.push({ id: 'scan_refs', status: 'blocked', reason: 'Attachment action requires a scan_ref before it can proceed.' });
  }

  if (context.event_type === 'catguard.submission.completed' && (!context.form_id || !context.submission_id || !context.customer_id)) {
    checks.push({ id: 'submission_context', status: 'blocked', reason: 'Completed submissions require form_id, submission_id, and customer_id.' });
  }

  if (crossesBoundary(context.memory_refs, context) || crossesBoundary(context.submission_refs, context)) {
    checks.push({ id: 'boundary_check', status: 'blocked', reason: 'Cross-customer or cross-workspace refs are blocked.' });
  }

  if (redaction === 'customer_safe_projection' && payloadContainsSensitiveRawData(context.payload)) {
    checks.push({ id: 'customer_safe_projection', status: 'blocked', reason: 'Raw sensitive data cannot be copied into customer-safe receipts.' });
  }

  const forbidden = contextAttemptsForbiddenBehavior(context);
  if (forbidden) {
    checks.push({ id: 'forbidden_behavior', status: 'blocked', reason: `Forbidden ${forbidden} behavior is not allowed in CatGuard Forms.` });
  }

  if (checks.length === 0) checks.push({ id: 'fail_closed_validation', status: 'pass' });
  return { checks, payloadHash, blockedReason: checks.find((check) => check.status === 'blocked')?.reason };
}

function lineageEventFor(eventType, blocked) {
  if (blocked) return LINEAGE_EVENT_BY_FAMILY.blocked;
  if (eventType.includes('.form.')) return LINEAGE_EVENT_BY_FAMILY.form;
  if (eventType.includes('.submission.')) return LINEAGE_EVENT_BY_FAMILY.submission;
  if (eventType.includes('.attachment.')) return LINEAGE_EVENT_BY_FAMILY.attachment;
  if (eventType.includes('.approval.')) return LINEAGE_EVENT_BY_FAMILY.approval;
  if (eventType.includes('.ai_action.')) return LINEAGE_EVENT_BY_FAMILY.ai_action;
  return 'catguard.receipt.linked_to_vault';
}

export function createCatGuardTrustNetReceipt(context) {
  const { checks, payloadHash, blockedReason } = validateContext(context);
  const blocked = Boolean(blockedReason) || context.event_type === 'catguard.policy.blocked';
  const timestamp = new Date().toISOString();
  const eventId = context.event_id || `evt_${randomUUID()}`;
  const receiptId = `rcpt_${randomUUID()}`;
  const safeEventType = SUPPORTED_TRUSTNET_EVENTS.has(context.event_type) ? context.event_type : 'catguard.policy.blocked';
  const receiptBase = {
    event_id: eventId,
    event_type: blocked ? 'catguard.policy.blocked' : safeEventType,
    from_address: context.from_address || { type: 'catguard_forms_address', id: 'blocked_missing_from_address' },
    to_address: context.to_address || { type: 'receipt_address', id: 'blocked_missing_to_address' },
    actor_type: context.actor_type || 'system',
    actor_id: context.actor_id || 'blocked_missing_actor',
    form_id: context.form_id,
    submission_id: context.submission_id,
    customer_id: context.customer_id,
    business_id: context.business_id,
    workspace_id: context.workspace_id,
    project_id: context.project_id,
    payload_hash: payloadHash || hashPayload({ blocked: true, reason: blockedReason || 'missing payload hash' }),
    payload_redaction_class: context.payload_redaction_class || context.redaction_class || 'hash_only',
    evidence_refs: refList(context.evidence_refs),
    source_refs: refList(context.source_refs),
    approval_refs: refList(context.approval_refs),
    vault_lineage_refs: [],
    policy_result: blocked ? 'blocked' : 'allowed',
    policy_checks: checks,
    previous_event_hash: context.previous_event_hash,
    blocked_reason: blockedReason,
    auth_status: context.auth_status || 'not_required',
    signature_status: context.signature_status,
    timestamp,
    receipt_id: receiptId,
    security_class: context.security_class || 'internal',
    retention_class: context.retention_class || 'standard',
  };
  return {
    ...receiptBase,
    receipt_hash: hashPayload(receiptBase),
  };
}

export function createCatGuardVaultLineageRecord(context, receipt) {
  const blocked = receipt.policy_result === 'blocked';
  const lineageId = `lin_${randomUUID()}`;
  return {
    lineage_id: lineageId,
    repo: 'Cattleguardforms/cattle-guard-forms',
    system_name: 'CatGuard Forms',
    module_name: context.module_name,
    action_id: context.action_id || lineageEventFor(receipt.event_type, blocked),
    event_id: receipt.event_id,
    receipt_id: receipt.receipt_id,
    memory_refs: refList(context.memory_refs),
    source_refs: refList(context.source_refs),
    decision_refs: refList(context.decision_refs),
    approval_refs: refList(context.approval_refs),
    evidence_refs: refList(context.evidence_refs),
    prompt_refs: refList(context.prompt_refs),
    customer_refs: refList(context.customer_refs),
    business_refs: refList(context.business_refs),
    form_refs: refList(context.form_refs).concat(context.form_id ? [{ id: context.form_id, type: 'form' }] : []),
    submission_refs: refList(context.submission_refs).concat(context.submission_id ? [{ id: context.submission_id, type: 'submission', customer_id: context.customer_id }] : []),
    field_refs: refList(context.field_refs),
    attachment_refs: refList(context.attachment_refs),
    signature_refs: refList(context.signature_refs),
    validation_refs: refList(context.validation_refs),
    receipt_refs: refList(context.receipt_refs).concat([{ id: receipt.receipt_id, type: 'trustnet_receipt' }]),
    trustnet_receipt_refs: [{ id: receipt.receipt_id, type: 'trustnet_receipt' }],
    policy_refs: refList(context.policy_refs),
    scan_refs: refList(context.scan_refs),
    redaction_class: context.redaction_class || context.payload_redaction_class || receipt.payload_redaction_class,
    retention_class: context.retention_class || receipt.retention_class,
    created_at: new Date().toISOString(),
    created_by_actor: { actor_type: receipt.actor_type, actor_id: receipt.actor_id },
    payload_hash: receipt.payload_hash,
    notes: context.notes,
    summary: context.summary,
  };
}

export function emitCatGuardFormActionWithReceiptAndLineage(context) {
  const receipt = createCatGuardTrustNetReceipt(context);
  const lineage = createCatGuardVaultLineageRecord(context, receipt);
  receipt.vault_lineage_refs = [{ id: lineage.lineage_id, type: 'vault_lineage' }];
  const linkedReceipt = { ...receipt, receipt_hash: hashPayload({ ...receipt, receipt_hash: undefined }) };
  const result = {
    ok: linkedReceipt.policy_result === 'allowed',
    receipt: linkedReceipt,
    lineage,
    policy_checks: linkedReceipt.policy_checks,
  };
  if (!result.ok) return { ...result, blocked_reason: linkedReceipt.blocked_reason || 'Policy blocked.' };
  return result;
}
