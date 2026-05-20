-- CatGuard Forms local TrustNet / Neroa Guard receipt and Neroa Vault lineage persistence.
-- Local foundation only: no live central Guard/Vault connection, no chain/RPC/wallet/token behavior.

create table if not exists public.catguard_trustnet_receipts (
  receipt_id text primary key,
  event_id text not null unique,
  event_type text not null,
  from_address jsonb not null,
  to_address jsonb not null,
  actor_type text not null,
  actor_id text not null,
  form_id text,
  submission_id text,
  customer_id text,
  business_id text,
  workspace_id text,
  project_id text,
  payload_hash text not null,
  receipt_hash text not null,
  payload_redaction_class text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  approval_refs jsonb not null default '[]'::jsonb,
  vault_lineage_refs jsonb not null default '[]'::jsonb,
  policy_result text not null,
  policy_checks jsonb not null default '[]'::jsonb,
  previous_event_hash text,
  blocked_reason text,
  auth_status text,
  signature_status text,
  timestamp timestamptz not null,
  security_class text not null,
  retention_class text not null,
  created_at timestamptz not null default now(),
  constraint catguard_trustnet_receipts_event_type_check check (event_type in (
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
    'catguard.policy.blocked'
  )),
  constraint catguard_trustnet_receipts_policy_result_check check (policy_result in ('allowed', 'blocked')),
  constraint catguard_trustnet_receipts_redaction_check check (payload_redaction_class in (
    'hash_only',
    'metadata_only',
    'redacted_summary',
    'private_internal',
    'customer_safe_projection',
    'raw_sensitive_internal'
  )),
  constraint catguard_trustnet_receipts_hash_format_check check (
    payload_hash like 'sha256:%' and receipt_hash like 'sha256:%'
  )
);

create table if not exists public.catguard_vault_lineage_records (
  lineage_id text primary key,
  repo text not null,
  system_name text not null,
  module_name text,
  action_id text not null,
  event_id text,
  receipt_id text not null references public.catguard_trustnet_receipts(receipt_id) on delete restrict,
  memory_refs jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  decision_refs jsonb not null default '[]'::jsonb,
  approval_refs jsonb not null default '[]'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  prompt_refs jsonb not null default '[]'::jsonb,
  customer_refs jsonb not null default '[]'::jsonb,
  business_refs jsonb not null default '[]'::jsonb,
  form_refs jsonb not null default '[]'::jsonb,
  submission_refs jsonb not null default '[]'::jsonb,
  field_refs jsonb not null default '[]'::jsonb,
  attachment_refs jsonb not null default '[]'::jsonb,
  signature_refs jsonb not null default '[]'::jsonb,
  validation_refs jsonb not null default '[]'::jsonb,
  receipt_refs jsonb not null default '[]'::jsonb,
  trustnet_receipt_refs jsonb not null default '[]'::jsonb,
  policy_refs jsonb not null default '[]'::jsonb,
  scan_refs jsonb not null default '[]'::jsonb,
  redaction_class text not null,
  retention_class text not null,
  created_at timestamptz not null,
  created_by_actor jsonb not null,
  payload_hash text not null,
  notes text,
  summary text,
  persisted_at timestamptz not null default now(),
  constraint catguard_vault_lineage_records_action_check check (action_id in (
    'catguard.form.linked_to_vault',
    'catguard.submission.linked_to_vault',
    'catguard.field_validation.linked_to_vault',
    'catguard.attachment.linked_to_vault',
    'catguard.signature.linked_to_vault',
    'catguard.approval.linked_to_vault',
    'catguard.export.linked_to_vault',
    'catguard.ai_action.linked_to_vault',
    'catguard.receipt.linked_to_vault',
    'vault.lineage.policy_blocked'
  )),
  constraint catguard_vault_lineage_records_redaction_check check (redaction_class in (
    'hash_only',
    'metadata_only',
    'redacted_summary',
    'private_internal',
    'customer_safe_projection',
    'raw_sensitive_internal'
  )),
  constraint catguard_vault_lineage_payload_hash_check check (payload_hash like 'sha256:%')
);

create index if not exists catguard_trustnet_receipts_customer_idx on public.catguard_trustnet_receipts(customer_id);
create index if not exists catguard_trustnet_receipts_submission_idx on public.catguard_trustnet_receipts(submission_id);
create index if not exists catguard_trustnet_receipts_timestamp_idx on public.catguard_trustnet_receipts(timestamp desc);
create index if not exists catguard_vault_lineage_receipt_idx on public.catguard_vault_lineage_records(receipt_id);
create index if not exists catguard_vault_lineage_created_at_idx on public.catguard_vault_lineage_records(created_at desc);

alter table public.catguard_trustnet_receipts enable row level security;
alter table public.catguard_vault_lineage_records enable row level security;

-- Local app/server-only policies. Browser clients do not get direct access.
drop policy if exists "service role manages catguard trustnet receipts" on public.catguard_trustnet_receipts;
create policy "service role manages catguard trustnet receipts"
  on public.catguard_trustnet_receipts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role manages catguard vault lineage records" on public.catguard_vault_lineage_records;
create policy "service role manages catguard vault lineage records"
  on public.catguard_vault_lineage_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
