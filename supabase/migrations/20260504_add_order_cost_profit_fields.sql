alter table orders
add column if not exists cost_of_goods_per_unit numeric,
add column if not exists product_cost_total numeric,
add column if not exists product_profit numeric,
add column if not exists freight_carrier_cost numeric,
add column if not exists freight_accessorial_cost numeric,
add column if not exists freight_markup_amount numeric,
add column if not exists freight_profit numeric,
add column if not exists gross_profit numeric;

create index if not exists orders_gross_profit_idx on orders (gross_profit);
