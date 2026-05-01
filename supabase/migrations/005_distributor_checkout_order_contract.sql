-- Distributor checkout/order contract columns
-- Run this in Supabase SQL Editor or through Supabase migrations before retesting live checkout.

alter table public.orders add column if not exists contact_name text;
alter table public.orders add column if not exists contact_email text;
alter table public.orders add column if not exists contact_phone text;

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;

alter table public.orders add column if not exists warranty_customer_name text;
alter table public.orders add column if not exists warranty_customer_email text;
alter table public.orders add column if not exists warranty_customer_phone text;

alter table public.orders add column if not exists delivery_type text;
alter table public.orders add column if not exists delivery_location_type text;
alter table public.orders add column if not exists liftgate_required text;

alter table public.orders add column if not exists selected_rate text;
alter table public.orders add column if not exists selected_freight_carrier text;
alter table public.orders add column if not exists selected_freight_service text;
alter table public.orders add column if not exists selected_freight_transit_days integer;
alter table public.orders add column if not exists freight_charge numeric;

alter table public.orders add column if not exists pallet_count integer;
alter table public.orders add column if not exists pallet_length_in integer;
alter table public.orders add column if not exists pallet_width_in integer;
alter table public.orders add column if not exists pallet_height_in integer;
alter table public.orders add column if not exists pallet_weight_lbs integer;

alter table public.orders add column if not exists bol_file text;

create index if not exists orders_distributor_profile_id_idx on public.orders(distributor_profile_id);
create index if not exists orders_order_type_idx on public.orders(order_type);
create index if not exists orders_checkout_status_idx on public.orders(checkout_status);
create index if not exists orders_shipment_status_idx on public.orders(shipment_status);
