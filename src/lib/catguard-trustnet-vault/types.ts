export const CATGUARD_SUPPORTED_TRUSTNET_EVENTS = [
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
] as const;

export const CATGUARD_KNOWN_TRUSTNET_EVENTS = [
  'catguard.form.created',
  'catguard.form.updated',
  'catguard.form.published',
  'catguard.form.archived',
  'catguard.form.policy_blocked',
  'catguard.submission.started',
  'catguard.submission.saved',
  'catguard.submission.completed',
  'catguard.submission.rejected',
  'catguard.submission.blocked',
  'catguard.field.validated',
  'catguard.field.validation_failed',
  'catguard.attachment.uploaded',
  'catguard.attachment.scanned',
  'catguard.attachment.blocked',
  'catguard.signature.requested',
  'catguard.signature.completed',
  'catguard.signature.rejected',
  'catguard.approval.required',
  'catguard.approval.recorded',
  'catguard.approval.rejected',
  'catguard.export.requested',
  'catguard.export.completed',
  'catguard.export.blocked',
  'catguard.ai_action.started',
  'catguard.ai_action.completed',
  'catguard.ai_action.blocked',
  'catguard.receipt.created',
  'catguard.policy.blocked',
] as const;

export const CATGUARD_LINEAGE_EVENTS = [
  'catguard.form.linked_to_vault',
  'catguard.submission.linked_to_vault',
  'catguard.field_validation.linked_to_vault',
  'catguard.attachment.linked_to_vault',
  'catguard.signature.linked_to_vault',
  'catguard.approval.linked_to_vault',
  'catguard.export.linked_to_vault',
  'catguard.ai_action.linked_to_vault',
  'catguard.receipt.linked_to_vault',
  'vault.lineage.policy_blocked',
] as const;

export const CATGUARD_ADDRESS_TYPES = [
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
] as const;

export const CATGUARD_REDACTION_CLASSES = [
  'hash_only',
  'metadata_only',
  'redacted_summary',
  'private_internal',
  'customer_safe_projection',
  'raw_sensitive_internal',
] as const;

export type CatGuardSupportedTrustNetEvent = typeof CATGUARD_SUPPORTED_TRUSTNET_EVENTS[number];
export type CatGuardKnownTrustNetEvent = typeof CATGUARD_KNOWN_TRUSTNET_EVENTS[number];
export type CatGuardLineageEvent = typeof CATGUARD_LINEAGE_EVENTS[number];
export type CatGuardAddressType = typeof CATGUARD_ADDRESS_TYPES[number];
export type CatGuardRedactionClass = typeof CATGUARD_REDACTION_CLASSES[number];

export type CatGuardActorType = 'human' | 'system' | 'worker' | 'neroabrain' | 'admin' | 'customer' | 'business';
export type CatGuardPolicyResult = 'allowed' | 'blocked';
export type CatGuardAuthStatus = 'verified' | 'unsigned_local' | 'failed' | 'not_required';
export type CatGuardSecurityClass = 'public_metadata' | 'internal' | 'confidential' | 'restricted';
export type CatGuardRetentionClass = 'ephemeral' | 'standard' | 'business_record' | 'legal_hold' | 'sensitive_limited';

export type CatGuardAddress = {
  type: CatGuardAddressType;
  id: string;
};

export type CatGuardRef = {
  id: string;
  type?: string;
  customer_id?: string;
  workspace_id?: string;
};

export type CatGuardPolicyCheck = {
  id: string;
  status: 'pass' | 'blocked';
  reason?: string;
};

export type CatGuardReceipt = {
  event_id: string;
  event_type: CatGuardSupportedTrustNetEvent;
  from_address: CatGuardAddress;
  to_address: CatGuardAddress;
  actor_type: CatGuardActorType;
  actor_id: string;
  form_id?: string;
  submission_id?: string;
  customer_id?: string;
  business_id?: string;
  workspace_id?: string;
  project_id?: string;
  payload_hash: string;
  receipt_hash?: string;
  payload_redaction_class: CatGuardRedactionClass;
  evidence_refs: CatGuardRef[];
  source_refs: CatGuardRef[];
  approval_refs: CatGuardRef[];
  vault_lineage_refs: CatGuardRef[];
  policy_result: CatGuardPolicyResult;
  policy_checks: CatGuardPolicyCheck[];
  previous_event_hash?: string;
  blocked_reason?: string;
  auth_status?: CatGuardAuthStatus;
  signature_status?: CatGuardAuthStatus;
  timestamp: string;
  receipt_id: string;
  security_class: CatGuardSecurityClass;
  retention_class: CatGuardRetentionClass;
};

export type CatGuardLineageRecord = {
  lineage_id: string;
  repo: string;
  system_name: string;
  module_name?: string;
  action_id: CatGuardLineageEvent;
  event_id?: string;
  receipt_id?: string;
  memory_refs: CatGuardRef[];
  source_refs: CatGuardRef[];
  decision_refs: CatGuardRef[];
  approval_refs: CatGuardRef[];
  evidence_refs: CatGuardRef[];
  prompt_refs: CatGuardRef[];
  customer_refs: CatGuardRef[];
  business_refs: CatGuardRef[];
  form_refs: CatGuardRef[];
  submission_refs: CatGuardRef[];
  field_refs: CatGuardRef[];
  attachment_refs: CatGuardRef[];
  signature_refs: CatGuardRef[];
  validation_refs: CatGuardRef[];
  receipt_refs: CatGuardRef[];
  trustnet_receipt_refs: CatGuardRef[];
  policy_refs: CatGuardRef[];
  scan_refs: CatGuardRef[];
  redaction_class: CatGuardRedactionClass;
  retention_class: CatGuardRetentionClass;
  created_at: string;
  created_by_actor: { actor_type: CatGuardActorType; actor_id: string };
  payload_hash: string;
  notes?: string;
  summary?: string;
};

export type CatGuardActionContext = {
  event_type: string;
  from_address?: CatGuardAddress;
  to_address?: CatGuardAddress;
  actor_type?: CatGuardActorType;
  actor_id?: string;
  form_id?: string;
  submission_id?: string;
  customer_id?: string;
  business_id?: string;
  workspace_id?: string;
  project_id?: string;
  payload?: unknown;
  payload_hash?: string;
  payload_redaction_class?: CatGuardRedactionClass;
  redaction_class?: CatGuardRedactionClass;
  security_class?: CatGuardSecurityClass;
  retention_class?: CatGuardRetentionClass;
  evidence_refs?: CatGuardRef[];
  source_refs?: CatGuardRef[];
  approval_refs?: CatGuardRef[];
  memory_refs?: CatGuardRef[];
  decision_refs?: CatGuardRef[];
  prompt_refs?: CatGuardRef[];
  customer_refs?: CatGuardRef[];
  business_refs?: CatGuardRef[];
  form_refs?: CatGuardRef[];
  submission_refs?: CatGuardRef[];
  field_refs?: CatGuardRef[];
  attachment_refs?: CatGuardRef[];
  signature_refs?: CatGuardRef[];
  validation_refs?: CatGuardRef[];
  receipt_refs?: CatGuardRef[];
  policy_refs?: CatGuardRef[];
  scan_refs?: CatGuardRef[];
  previous_event_hash?: string;
  auth_status?: CatGuardAuthStatus;
  signature_status?: CatGuardAuthStatus;
  action_id?: CatGuardLineageEvent;
  module_name?: string;
  notes?: string;
  summary?: string;
  requires_source_ref?: boolean;
  requires_approval_ref?: boolean;
  requires_signature_ref?: boolean;
  requires_attachment_scan?: boolean;
};

export type CatGuardIntegrationResult =
  | { ok: true; receipt: CatGuardReceipt; lineage: CatGuardLineageRecord; policy_checks: CatGuardPolicyCheck[] }
  | { ok: false; receipt: CatGuardReceipt; lineage: CatGuardLineageRecord; policy_checks: CatGuardPolicyCheck[]; blocked_reason: string };
