-- Order file / BOL attachment workflow
-- Run this in Supabase SQL Editor or through Supabase migrations.
-- Also create a private Supabase Storage bucket named: order-files

create table if not exists public.order_files (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  file_type text not null,
  file_name text not null,
  storage_path text not null unique,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid,
  uploaded_by_role text,
  created_at timestamptz not null default now(),
  constraint order_files_file_type_check check (
    file_type in ('original_bol', 'signed_bol', 'shipping_document', 'other_order_attachment')
  )
);

create index if not exists order_files_order_id_idx on public.order_files(order_id);
create index if not exists order_files_file_type_idx on public.order_files(file_type);
create index if not exists order_files_created_at_idx on public.order_files(created_at desc);

alter table public.order_files enable row level security;

-- Service-role API routes manage order file access. Keep direct browser access closed.
drop policy if exists "order_files_service_role_all" on public.order_files;
create policy "order_files_service_role_all"
  on public.order_files
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
