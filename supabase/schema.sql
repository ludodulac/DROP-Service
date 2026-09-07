-- DROP-Service / Assistant Demandes & Devis
-- Initial database schema for the V1.
-- Apply through a Supabase migration once the target project is active.

create extension if not exists pgcrypto;

create type public.request_status as enum (
  'new',
  'contacted',
  'quote_sent',
  'won',
  'lost'
);

create type public.request_urgency as enum (
  'low',
  'normal',
  'urgent'
);

create table public.artisans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null,
  activity text not null,
  phone text,
  email text,
  service_area text,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artisans_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.customer_requests (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  city text not null,
  category text not null,
  description text not null,
  urgency public.request_urgency not null default 'normal',
  availability text,
  status public.request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_requests_name_length check (char_length(customer_name) between 2 and 120),
  constraint customer_requests_phone_length check (char_length(customer_phone) between 6 and 40),
  constraint customer_requests_city_length check (char_length(city) between 1 and 120),
  constraint customer_requests_category_length check (char_length(category) between 1 and 120),
  constraint customer_requests_description_length check (char_length(description) between 3 and 5000)
);

create index customer_requests_artisan_created_idx
  on public.customer_requests (artisan_id, created_at desc);

create index customer_requests_artisan_status_idx
  on public.customer_requests (artisan_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger artisans_set_updated_at
before update on public.artisans
for each row execute function public.set_updated_at();

create trigger customer_requests_set_updated_at
before update on public.customer_requests
for each row execute function public.set_updated_at();

-- Explicit Data API grants. RLS below still controls which rows are reachable.
revoke all on public.artisans from anon, authenticated;
revoke all on public.customer_requests from anon, authenticated;

grant select on public.artisans to anon;
grant select, insert, update on public.artisans to authenticated;

grant insert on public.customer_requests to anon;
grant select, insert, update on public.customer_requests to authenticated;

alter table public.artisans enable row level security;
alter table public.customer_requests enable row level security;

-- Public artisan pages may read only active artisan rows. The frontend should
-- explicitly select the public fields it needs rather than select('*').
create policy "active artisan profiles are public"
on public.artisans
for select
to anon, authenticated
using (is_active = true);

create policy "artisan can create own profile"
on public.artisans
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "artisan can update own profile"
on public.artisans
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Public prospects may submit a request only to an active artisan.
-- They cannot read requests afterward.
create policy "public can submit request to active artisan"
on public.customer_requests
for insert
to anon
with check (
  exists (
    select 1
    from public.artisans a
    where a.id = artisan_id
      and a.is_active = true
  )
  and status = 'new'::public.request_status
);

-- Authenticated artisans can also create requests for themselves, e.g. when
-- entering a phone lead manually later.
create policy "artisan can create own request"
on public.customer_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.artisans a
    where a.id = artisan_id
      and a.user_id = (select auth.uid())
  )
);

create policy "artisan can read own requests"
on public.customer_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.artisans a
    where a.id = artisan_id
      and a.user_id = (select auth.uid())
  )
);

create policy "artisan can update own requests"
on public.customer_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.artisans a
    where a.id = artisan_id
      and a.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.artisans a
    where a.id = artisan_id
      and a.user_id = (select auth.uid())
  )
);

-- No DELETE grant/policy in the V1: requests are retained rather than
-- accidentally deleted from the dashboard.

-- NOTE ABOUT PHOTOS
-- Request photos are intentionally not configured in this first schema.
-- We will add a private Storage bucket and tightly scoped policies/server-side
-- upload flow after the basic request workflow is validated. This avoids
-- creating an overly permissive anonymous upload bucket.
