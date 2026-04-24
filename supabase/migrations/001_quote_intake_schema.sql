-- Cattle Guard Forms - Quote Intake Schema Draft
-- Migration: 001_quote_intake_schema.sql
-- Status: REVIEWABLE DRAFT ONLY. This file has not been applied automatically.
-- Apply deliberately through the Supabase SQL Editor or an approved Supabase CLI flow.

-- -----------------------------------------------------------------------------
-- Customers table expansion
-- -----------------------------------------------------------------------------

alter table public.customers
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists company text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text;

-- -----------------------------------------------------------------------------
-- Orders / quote request table expansion
-- -----------------------------------------------------------------------------

alter table public.orders
  add column if not exists product_type text,
  add column if not exists quantity integer,
  add column if not exists dimensions text,
  add column if not exists specifications text,
  add column if not exists installation_needed boolean default false,
  add column if not exists delivery_needed boolean default false,
  add column if not exists project_address_line1 text,
  add column if not exists project_address_line2 text,
  add column if not exists project_city text,
  add column if not exists project_state text,
  add column if not exists project_postal_code text,
  add column if not exists notes text,
  add column if not exists admin_notes text,
  add column if not exists quote_amount numeric,
  add column if not exists updated_at timestamp without time zone default now();

-- -----------------------------------------------------------------------------
-- Draft status check constraint
-- Leave commented out until the final status lifecycle is approved.
-- -----------------------------------------------------------------------------

-- alter table public.orders
--   add constraint orders_status_check
--   check (status in ('pending', 'reviewing', 'quoted', 'approved', 'cancelled', 'completed'));

-- -----------------------------------------------------------------------------
-- Draft updated_at trigger
-- Leave commented out until trigger behavior is approved.
-- -----------------------------------------------------------------------------

-- create or replace function public.set_updated_at()
-- returns trigger as $$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $$ language plpgsql;

-- drop trigger if exists set_orders_updated_at on public.orders;
-- create trigger set_orders_updated_at
-- before update on public.orders
-- for each row
-- execute function public.set_updated_at();
