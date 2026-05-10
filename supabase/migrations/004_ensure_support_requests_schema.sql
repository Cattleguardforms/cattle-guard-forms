-- Ensure support request table exists in production Supabase.
-- This migration is intentionally idempotent because the live site can fail with:
-- "Could not find the table 'public.support_requests' in the schema cache"

create extension if not exists pgcrypto;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  customer_id uuid,
  name text,
  email text not null,
  phone text,
  company text,
  topic text,
  message text,
  source text default 'website',
  status text not null default 'open' check (status in ('open', 'in_review', 'waiting_on_customer', 'resolved', 'archived')),
  matched_by text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_email_idx on public.support_requests(email);
create index if not exists support_requests_order_id_idx on public.support_requests(order_id);
create index if not exists support_requests_status_idx on public.support_requests(status);

alter table public.support_requests enable row level security;

-- Supabase/PostgREST schema cache refresh. Safe to run even if no listener is active.
notify pgrst, 'reload schema';
