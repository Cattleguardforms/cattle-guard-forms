alter table orders
add column if not exists po_number text,
add column if not exists distributor_po_number text;

create index if not exists orders_po_number_idx on orders (po_number);
create index if not exists orders_distributor_po_number_idx on orders (distributor_po_number);
