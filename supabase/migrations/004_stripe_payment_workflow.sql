-- Stripe payment workflow columns
-- Run this in Supabase SQL Editor or through Supabase migrations.

alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists amount_paid numeric;
alter table public.orders add column if not exists currency text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists checkout_status text;
alter table public.orders add column if not exists payment_failure_message text;

create index if not exists orders_stripe_checkout_session_id_idx on public.orders(stripe_checkout_session_id);
create index if not exists orders_stripe_payment_intent_id_idx on public.orders(stripe_payment_intent_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
