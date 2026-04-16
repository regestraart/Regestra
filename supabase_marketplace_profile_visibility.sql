-- Regestra: Marketplace + Profile dual visibility + decoupled removals
-- Run in Supabase SQL Editor.

begin;

-- 1) Schema changes
alter table public.artworks
  add column if not exists profile_visible boolean not null default true,
  add column if not exists marketplace_visible boolean not null default false,
  add column if not exists image_path text;

-- Backfill: anything already listed_for_sale should show on marketplace by default.
update public.artworks
set marketplace_visible = true
where listed_for_sale = true;

-- 2) OPTIONAL: Remove ALL existing marketplace listings (requested)
--    This keeps the artworks available for profile display (profile_visible stays true)
update public.artworks
set
  listed_for_sale = false,
  marketplace_visible = false,
  list_price = null,
  listing_status = null,
  sold_at = null
where marketplace_visible = true or listed_for_sale = true;

-- 3) RLS policies (ensure ANY authenticated user can list for sale)
alter table public.artworks enable row level security;

-- Drop existing conflicting policies (safe if they don't exist)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='artworks' and policyname='artworks_select') then
    execute 'drop policy artworks_select on public.artworks';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='artworks' and policyname='artworks_insert') then
    execute 'drop policy artworks_insert on public.artworks';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='artworks' and policyname='artworks_update') then
    execute 'drop policy artworks_update on public.artworks';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='artworks' and policyname='artworks_delete') then
    execute 'drop policy artworks_delete on public.artworks';
  end if;
end $$;

-- Public/anon can see:
--  - profile-visible artworks
--  - marketplace-visible active listings
-- Owners can always see their own rows.
create policy artworks_select on public.artworks
for select
using (
  (auth.uid() = artist_id)
  or (profile_visible = true)
  or (
    marketplace_visible = true
    and listed_for_sale = true
    and (listing_status is null or listing_status = 'active')
  )
);

-- Any authenticated user can insert artworks for themselves
create policy artworks_insert on public.artworks
for insert
with check (auth.uid() = artist_id);

-- Only the owner can update their artworks
create policy artworks_update on public.artworks
for update
using (auth.uid() = artist_id)
with check (auth.uid() = artist_id);

-- Only the owner can delete their artworks
create policy artworks_delete on public.artworks
for delete
using (auth.uid() = artist_id);

commit;
