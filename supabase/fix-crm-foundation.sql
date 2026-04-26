-- Cattle Guard Forms CRM foundation repair script
-- Run this in Supabase SQL Editor before importing 2019, 2020, or 2021 historical CRM data.
-- This script is additive/safe and is designed to repair existing tables without dropping data.

create extension if not exists pgcrypto;

-- 1. App profiles / admin role foundation
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

insert into public.app_profiles (user_id, email, full_name, company_name, role, status)
select id, email, 'Cattle Guard Forms Support', 'Cattle Guard Forms', 'admin', 'active'
from auth.users
where email = 'support@cattleguardforms.com'
on conflict (email) do update
set role = 'admin',
    status = 'active',
    user_id = excluded.user_id,
    full_name = excluded.full_name,
    company_name = excluded.company_name;

-- 2. Repair customers table for optional company/contact fields and legacy import metadata
alter table public.customers add column if not exists source text;
alter table public.customers add column if not exists status text default 'active';
alter table public.customers add column if not exists company_name text;
alter table public.customers add column if not exists company_email text;
alter table public.customers add column if not exists company_phone text;
alter table public.customers add column if not exists customer_name text;
alter table public.customers add column if not exists email text;
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists address text;
alter table public.customers add column if not exists city text;
alter table public.customers add column if not exists state text;
alter table public.customers add column if not exists zip text;
alter table public.customers add column if not exists legacy_import_year integer;
alter table public.customers add column if not exists legacy_source_file text;
alter table public.customers add column if not exists raw_vendor_name text;
alter table public.customers add column if not exists normalized_vendor_name text;
alter table public.customers add column if not exists notes text;
alter table public.customers add column if not exists created_at timestamptz default now();
alter table public.customers add column if not exists updated_at timestamptz default now();

-- Optional company/contact fields must never block historical import.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'customers' and column_name = 'company_name') then
    alter table public.customers alter column company_name drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'customers' and column_name = 'company_email') then
    alter table public.customers alter column company_email drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'customers' and column_name = 'company_phone') then
    alter table public.customers alter column company_phone drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'customers' and column_name = 'email') then
    alter table public.customers alter column email drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'customers' and column_name = 'phone') then
    alter table public.customers alter column phone drop not null;
  end if;
end $$;

-- 3. Distributor profiles should support legacy/vendor records without requiring contact email/phone.
create table if not exists public.distributor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  price_per_unit numeric not null default 750,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.distributor_profiles add column if not exists legacy_vendor boolean default false;
alter table public.distributor_profiles add column if not exists aliases text[] default '{}'::text[];
alter table public.distributor_profiles alter column contact_email drop not null;
alter table public.distributor_profiles alter column contact_phone drop not null;

-- Seed active current distributor profiles.
insert into public.distributor_profiles (company_name, contact_name, contact_email, contact_phone, status, price_per_unit, legacy_vendor, aliases, notes)
values
  ('Barn World', null, null, null, 'active', 750, false, array[]::text[], 'Active distributor profile.'),
  ('Farm and Ranch Experts', null, null, null, 'active', 750, false, array['Farm & Ranch Experts', 'Farm and Ranch'], 'Active distributor profile.')
on conflict do nothing;

-- 4. Old vendors. TSC must normalize to Tractor Supply Company.
create table if not exists public.old_vendors (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  aliases text[] default '{}'::text[],
  status text not null default 'archived' check (status in ('active', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.old_vendors (name, aliases, status, notes)
values ('Tractor Supply Company', array['TSC', 'Tractor Supply', 'Tractor Supply Co.'], 'archived', 'Historical old vendor imported from legacy sales files.')
on conflict (name) do update
set aliases = excluded.aliases,
    status = excluded.status,
    notes = excluded.notes,
    updated_at = now();

insert into public.distributor_profiles (company_name, contact_name, contact_email, contact_phone, status, price_per_unit, legacy_vendor, aliases, notes)
values ('Tractor Supply Company', null, null, null, 'disabled', 750, true, array['TSC', 'Tractor Supply', 'Tractor Supply Co.'], 'Archived legacy vendor for historical CRM imports.')
on conflict do nothing;

-- 5. Product catalog. Texan stays archived for historical analysis, not deleted.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.products (name, status, notes)
values
  ('CowStop Reusable Form', 'active', 'Primary current cattle guard form product.'),
  ('Texan', 'archived', 'Archived legacy product retained for historical sales analysis and possible future review.')
on conflict (name) do update
set status = excluded.status,
    notes = excluded.notes,
    updated_at = now();

-- 6. Repair orders/sales table for historical sale fields.
alter table public.orders add column if not exists order_type text;
alter table public.orders add column if not exists sale_date date;
alter table public.orders add column if not exists product_name text;
alter table public.orders add column if not exists product_status text default 'active';
alter table public.orders add column if not exists quantity integer;
alter table public.orders add column if not exists cowstop_quantity integer;
alter table public.orders add column if not exists unit_price numeric;
alter table public.orders add column if not exists total numeric;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists shipping_method text;
alter table public.orders add column if not exists bol_file text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists expected_ship_date date;
alter table public.orders add column if not exists distributor_profile_id uuid;
alter table public.orders add column if not exists old_vendor_id uuid;
alter table public.orders add column if not exists raw_vendor_name text;
alter table public.orders add column if not exists normalized_vendor_name text;
alter table public.orders add column if not exists legacy_import_year integer;
alter table public.orders add column if not exists legacy_source_file text;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_address text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();

-- Historical sales can have incomplete contact data. Do not force optional customer fields.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_email') then
    alter table public.orders alter column customer_email drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_phone') then
    alter table public.orders alter column customer_phone drop not null;
  end if;
end $$;

-- 7. CRM activity and import batch/error tracking.
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

create table if not exists public.crm_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  import_year integer,
  status text not null default 'pending' check (status in ('pending', 'validated', 'importing', 'completed', 'failed')),
  total_rows integer default 0,
  imported_customers integer default 0,
  imported_orders integer default 0,
  skipped_rows integer default 0,
  error_rows integer default 0,
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.crm_import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.crm_import_batches(id) on delete cascade,
  row_number integer,
  row_data jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

-- 8. RLS. Service-role server routes can still import. Client policies should be tightened later.
alter table public.app_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.distributor_profiles enable row level security;
alter table public.old_vendors enable row level security;
alter table public.products enable row level security;
alter table public.crm_activity enable row level security;
alter table public.crm_import_batches enable row level security;
alter table public.crm_import_errors enable row level security;

-- 9. Verification queries. Results should show required CRM foundation records.
select 'admin_profile' as check_name, email, role, status
from public.app_profiles
where email = 'support@cattleguardforms.com';

select 'distributors' as check_name, company_name, status, price_per_unit, legacy_vendor
from public.distributor_profiles
where company_name in ('Barn World', 'Farm and Ranch Experts', 'Tractor Supply Company')
order by company_name;

select 'old_vendor' as check_name, name, aliases, status
from public.old_vendors
where name = 'Tractor Supply Company';

select 'products' as check_name, name, status
from public.products
where name in ('CowStop Reusable Form', 'Texan')
order by name;
