create extension if not exists pgcrypto;

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'page_view',
  page_path text not null default '/',
  page_title text,
  referrer text,
  visitor_id text,
  session_id text,
  channel text not null default 'direct' check (channel in ('direct', 'organic_search', 'social', 'distributor_referral', 'paid_campaign', 'referral')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  gclid text,
  fbclid text,
  ttclid text,
  li_fat_id text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists site_analytics_events_created_at_idx on public.site_analytics_events(created_at desc);
create index if not exists site_analytics_events_channel_idx on public.site_analytics_events(channel);
create index if not exists site_analytics_events_event_type_idx on public.site_analytics_events(event_type);
create index if not exists site_analytics_events_page_path_idx on public.site_analytics_events(page_path);
create index if not exists site_analytics_events_session_idx on public.site_analytics_events(session_id);
create index if not exists site_analytics_events_visitor_idx on public.site_analytics_events(visitor_id);

alter table public.site_analytics_events enable row level security;
