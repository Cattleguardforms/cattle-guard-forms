-- Support request and manufacturer shipping update workflow schema
-- Run this in Supabase SQL Editor or through Supabase migrations.

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

create table if not exists public.manufacturer_shipping_updates (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  order_reference text,
  order_status text default 'shipped',
  ship_date date,
  carrier text,
  tracking_number text,
  tracking_link text,
  estimated_delivery_date date,
  number_of_pallets text,
  freight_class text,
  bol_number text,
  bol_file text,
  manufacturer_notes text,
  raw_update text,
  source text default 'manufacturer_update_form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manufacturer_shipping_updates_order_id_idx on public.manufacturer_shipping_updates(order_id);
create index if not exists manufacturer_shipping_updates_order_reference_idx on public.manufacturer_shipping_updates(order_reference);
create index if not exists manufacturer_shipping_updates_tracking_number_idx on public.manufacturer_shipping_updates(tracking_number);

alter table public.orders add column if not exists ship_date date;
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists tracking_link text;
alter table public.orders add column if not exists estimated_delivery_date date;
alter table public.orders add column if not exists number_of_pallets text;
alter table public.orders add column if not exists freight_class text;
alter table public.orders add column if not exists bol_number text;
alter table public.orders add column if not exists manufacturer_notes text;
alter table public.orders add column if not exists shipment_status text default 'pending';

alter table public.support_requests enable row level security;
alter table public.manufacturer_shipping_updates enable row level security;

-- Server/service-role routes write these tables. Public read/write policies are intentionally not added.
