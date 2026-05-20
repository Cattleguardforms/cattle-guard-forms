import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCatGuardTrustNetReceipt,
  createCatGuardVaultLineageRecord,
  emitCatGuardFormActionWithReceiptAndLineage,
  hashPayload,
} from '../src/lib/catguard-trustnet-vault/index.mjs';

const baseContext = {
  event_type: 'catguard.form.created',
  from_address: { type: 'actor_address', id: 'actor_1' },
  to_address: { type: 'form_address', id: 'form_1' },
  actor_type: 'human',
  actor_id: 'user_1',
  form_id: 'form_1',
  customer_id: 'customer_1',
  business_id: 'business_1',
  workspace_id: 'workspace_1',
  payload: { action: 'created', form_id: 'form_1' },
  payload_redaction_class: 'metadata_only',
  security_class: 'internal',
  retention_class: 'business_record',
  source_refs: [{ id: 'src_1', type: 'operator_input', customer_id: 'customer_1' }],
  evidence_refs: [{ id: 'evidence_1', type: 'audit_snapshot' }],
};

function validContext(overrides = {}) {
  return { ...baseContext, ...overrides };
}

test('valid TrustNet receipt creation', () => {
  const receipt = createCatGuardTrustNetReceipt(validContext());
  assert.equal(receipt.policy_result, 'allowed');
  assert.equal(receipt.event_type, 'catguard.form.created');
  assert.equal(receipt.payload_hash.startsWith('sha256:'), true);
  assert.equal(receipt.receipt_hash.startsWith('sha256:'), true);
});

test('valid Vault lineage record creation', () => {
  const receipt = createCatGuardTrustNetReceipt(validContext());
  const lineage = createCatGuardVaultLineageRecord(validContext(), receipt);
  assert.equal(lineage.repo, 'Cattleguardforms/cattle-guard-forms');
  assert.equal(lineage.system_name, 'CatGuard Forms');
  assert.equal(lineage.receipt_id, receipt.receipt_id);
  assert.equal(lineage.payload_hash, receipt.payload_hash);
});

test('receipt links to lineage record', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext());
  assert.equal(result.ok, true);
  assert.equal(result.receipt.vault_lineage_refs[0].id, result.lineage.lineage_id);
  assert.equal(result.lineage.trustnet_receipt_refs[0].id, result.receipt.receipt_id);
});

test('form created emits receipt and lineage', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ event_type: 'catguard.form.created' }));
  assert.equal(result.ok, true);
  assert.equal(result.receipt.event_type, 'catguard.form.created');
  assert.equal(result.lineage.action_id, 'catguard.form.linked_to_vault');
});

test('submission completed emits receipt and lineage', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({
    event_type: 'catguard.submission.completed',
    to_address: { type: 'submission_address', id: 'sub_1' },
    submission_id: 'sub_1',
    payload: { action: 'completed', submission_id: 'sub_1' },
  }));
  assert.equal(result.ok, true);
  assert.equal(result.receipt.event_type, 'catguard.submission.completed');
  assert.equal(result.lineage.action_id, 'catguard.submission.linked_to_vault');
});

test('missing from_address fails closed', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ from_address: undefined }));
  assert.equal(result.ok, false);
  assert.equal(result.receipt.event_type, 'catguard.policy.blocked');
  assert.match(result.blocked_reason, /from_address/);
});

test('missing to_address fails closed', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ to_address: undefined }));
  assert.equal(result.ok, false);
  assert.equal(result.receipt.event_type, 'catguard.policy.blocked');
  assert.match(result.blocked_reason, /to_address/);
});

test('unknown event type fails closed', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ event_type: 'catguard.unknown.event' }));
  assert.equal(result.ok, false);
  assert.equal(result.receipt.event_type, 'catguard.policy.blocked');
  assert.match(result.blocked_reason, /Unknown/);
});

test('missing payload_hash fails closed when payload is absent', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ payload: undefined, payload_hash: undefined }));
  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /payload_hash/);
});

test('missing redaction_class fails closed', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ payload_redaction_class: undefined, redaction_class: undefined }));
  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /redaction/);
});

test('approval-required action without approval_ref fails closed', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({
    event_type: 'catguard.approval.recorded',
    to_address: { type: 'approval_address', id: 'approval_1' },
    approval_refs: [],
  }));
  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /Approval/);
});

test('attachment action without scan ref blocks when scan is required', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({
    event_type: 'catguard.attachment.uploaded',
    to_address: { type: 'attachment_address', id: 'attach_1' },
    attachment_refs: [{ id: 'attach_1', type: 'file' }],
    requires_attachment_scan: true,
    scan_refs: [],
  }));
  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /scan_ref/);
});

test('raw sensitive form data blocked from customer-safe projection', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({
    payload_redaction_class: 'customer_safe_projection',
    payload: { customer_name: 'A Customer', ssn: '000-00-0000' },
  }));
  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /Raw sensitive data/);
});

test('cross-customer submission lineage blocked', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({
    event_type: 'catguard.submission.completed',
    to_address: { type: 'submission_address', id: 'sub_1' },
    submission_id: 'sub_1',
    submission_refs: [{ id: 'sub_other', customer_id: 'customer_2' }],
  }));
  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /Cross-customer/);
});

test('policy.blocked receipt path works', () => {
  const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ event_type: 'catguard.policy.blocked' }));
  assert.equal(result.ok, false);
  assert.equal(result.receipt.event_type, 'catguard.policy.blocked');
  assert.equal(result.lineage.action_id, 'vault.lineage.policy_blocked');
});

test('forbidden wallet/token/mainnet/gas/custody/bridge behavior blocked', () => {
  for (const word of ['wallet', 'token', 'mainnet', 'gas', 'custody', 'bridge']) {
    const result = emitCatGuardFormActionWithReceiptAndLineage(validContext({ notes: `attempt ${word} behavior` }));
    assert.equal(result.ok, false, word);
    assert.match(result.blocked_reason, new RegExp(word));
  }
});

test('hashPayload produces deterministic hashes', () => {
  assert.equal(hashPayload({ b: 2, a: 1 }), hashPayload({ a: 1, b: 2 }));
});
