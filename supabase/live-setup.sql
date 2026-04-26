-- Cattle Guard Forms Supabase live setup
-- Run this in Supabase SQL Editor after creating the project.
-- This script is intentionally additive and uses IF NOT EXISTS where possible.

create extension if not exists pgcrypto;

-- App roles for admin/distributor/customer gating.
create table if not exists public.app_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  company_name text,
  role text not null default 'customer' check (role in ('admin', 'distributor', 'customer')),
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing project already has customers/orders; add missing CRM-safe columns only.
alter table public.customers add column if not exists source text;
alter table public.customers add column if not exists status text default 'active';
alter table public.customers add column if not exists created_at timestamptz default now();
alter table public.customers add column if not exists updated_at timestamptz default now();

alter table public.orders add column if not exists order_type text;
alter table public.orders add column if not exists unit_price numeric;
alter table public.orders add column if not exists total numeric;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists shipping_method text;
alter table public.orders add column if not exists bol_file text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists expected_ship_date date;
alter table public.orders add column if not exists distributor_profile_id uuid;
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();

create table if not exists public.distributor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  price_per_unit numeric not null default 750,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),
  email text,
  customer_name text,
  company_name text,
  product_name text default 'CowStop Reusable Form',
  quantity integer,
  estimated_value numeric,
  checkout_stage text default 'started',
  stripe_session_id text,
  recovery_status text default 'not_contacted',
  last_activity_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  source text,
  referrer text,
  visitor_id text,
  user_email text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_activity (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null,
  title text not null,
  description text,
  customer_id uuid,
  order_id uuid,
  distributor_profile_id uuid,
  source text,
  status text default 'open',
  assigned_to text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text,
  status text default 'planning',
  start_date date,
  end_date date,
  budget numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  title text not null,
  channel text,
  caption text,
  status text default 'idea',
  scheduled_at timestamptz,
  published_at timestamptz,
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Storage buckets. Policies can be tightened after auth roles are fully enforced.
insert into storage.buckets (id, name, public)
values ('distributor-logos', 'distributor-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('bol-files', 'bol-files', false)
on conflict (id) do nothing;

-- Enable RLS. Service-role server routes can still write. Client policies should be tightened later.
alter table public.app_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.distributor_profiles enable row level security;
alter table public.abandoned_checkouts enable row level security;
alter table public.site_events enable row level security;
alter table public.crm_activity enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_posts enable row level security;

-- Minimal authenticated read policy for setup/testing. Replace with role-scoped policies before production.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_profiles' and policyname = 'Authenticated users can read own profile') then
    create policy "Authenticated users can read own profile" on public.app_profiles
      for select to authenticated using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'distributor_profiles' and policyname = 'Authenticated users can read distributor profiles during setup') then
    create policy "Authenticated users can read distributor profiles during setup" on public.distributor_profiles
      for select to authenticated using (true);
  end if;
end $$;

-- After creating support@cattleguardforms.com in Authentication > Users,
-- run this to mark it as the admin profile:
-- insert into public.app_profiles (user_id, email, full_name, company_name, role, status)
-- select id, email, 'Cattle Guard Forms Support', 'Cattle Guard Forms', 'admin', 'active'
-- from auth.users
-- where email = 'support@cattleguardforms.com'
-- on conflict (email) do update set role = 'admin', status = 'active', user_id = excluded.user_id;
