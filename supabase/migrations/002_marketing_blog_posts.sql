-- Marketing blog publishing schema
-- Run this in Supabase SQL Editor or through Supabase migrations.

create extension if not exists pgcrypto;

create table if not exists public.marketing_blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null default 'Product education',
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'published', 'archived')),
  publish_date date,
  seo_title text,
  meta_description text,
  excerpt text,
  body text,
  campaign text,
  hero_image_prompt text,
  supporting_image_prompts text,
  video_pack text,
  social_pack text,
  email_pack text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_blog_posts_status_idx on public.marketing_blog_posts(status);
create index if not exists marketing_blog_posts_published_at_idx on public.marketing_blog_posts(published_at desc);
create index if not exists marketing_blog_posts_slug_idx on public.marketing_blog_posts(slug);

alter table public.marketing_blog_posts enable row level security;

-- Public website can read published posts through anon/public key if needed.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'marketing_blog_posts'
      and policyname = 'Published blog posts are publicly readable'
  ) then
    create policy "Published blog posts are publicly readable" on public.marketing_blog_posts
      for select to anon, authenticated
      using (status = 'published');
  end if;
end $$;
