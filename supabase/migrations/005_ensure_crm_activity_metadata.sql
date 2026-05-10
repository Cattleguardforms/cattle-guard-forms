-- Ensure crm_activity supports support-request metadata writes.
-- The Contact Support API inserts metadata: { support_request_id: ... }.
-- This migration is idempotent and safe to run against production.

alter table public.crm_activity
  add column if not exists metadata jsonb default '{}'::jsonb;

-- Keep existing rows consistent for code that expects an object.
update public.crm_activity
set metadata = '{}'::jsonb
where metadata is null;

notify pgrst, 'reload schema';
