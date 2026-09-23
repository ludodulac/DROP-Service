-- BRIF existing production baseline — captured 2026-09-23
-- Source of truth: live Supabase schema, inspected read-only.
-- SQL object names intentionally retain the existing DROP SERVICE naming.
--
-- IMPORTANT: this is a point-in-time baseline/documentation snapshot.
-- It records objects that ALREADY EXIST in production and MUST NOT be applied
-- blindly to that production database. Future BRIF changes should be separate
-- incremental migrations.
--
-- Scope only:
--   public.drop_service_artisans
--   public.drop_service_requests
--   public.drop_service_request_photos
--   public.drop_service_subscriptions
--   directly required trigger function/triggers
--   storage bucket drop-service-request-photos and its storage.objects policies
--
-- No production rows or user identifiers are included.

create extension if not exists pgcrypto;

create table public.drop_service_artisans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null
    constraint drop_service_artisans_company_name_check
    check (char_length(company_name) >= 2 and char_length(company_name) <= 120),
  slug text not null unique
    constraint drop_service_artisans_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text
      and char_length(slug) >= 2 and char_length(slug) <= 80),
  activity text not null
    constraint drop_service_artisans_activity_check
    check (char_length(activity) >= 2 and char_length(activity) <= 120),
  service_area text,
  phone text,
  email text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.drop_service_requests (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.drop_service_artisans(id) on delete cascade,
  customer_name text not null
    constraint drop_service_requests_customer_name_check
    check (char_length(customer_name) >= 2 and char_length(customer_name) <= 120),
  phone text not null
    constraint drop_service_requests_phone_check
    check (char_length(phone) >= 6 and char_length(phone) <= 40),
  email text,
  city text not null
    constraint drop_service_requests_city_check
    check (char_length(city) >= 1 and char_length(city) <= 120),
  category text not null
    constraint drop_service_requests_category_check
    check (char_length(category) >= 1 and char_length(category) <= 120),
  description text not null
    constraint drop_service_requests_description_check
    check (char_length(description) >= 5 and char_length(description) <= 4000),
  urgency text not null default 'normal'
    constraint drop_service_requests_urgency_check
    check (urgency = any (array['low'::text, 'normal'::text, 'urgent'::text])),
  availability text,
  status text not null default 'new'
    constraint drop_service_requests_status_check
    check (status = any (array['new'::text, 'contacted'::text, 'quote_sent'::text, 'won'::text, 'lost'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drop_service_requests_artisan_created_idx
  on public.drop_service_requests using btree (artisan_id, created_at desc);
create index drop_service_requests_artisan_status_idx
  on public.drop_service_requests using btree (artisan_id, status);

create table public.drop_service_request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.drop_service_requests(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

-- This table corresponds to the production migration recorded by Supabase as:
-- 20260922170457 add_drop_service_subscriptions
create table public.drop_service_subscriptions (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null unique references public.drop_service_artisans(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive'
    constraint drop_service_subscriptions_status_check
    check (status = any (array[
      'inactive'::text, 'trialing'::text, 'active'::text, 'past_due'::text,
      'canceled'::text, 'unpaid'::text, 'incomplete'::text,
      'incomplete_expired'::text, 'paused'::text
    ])),
  billing_interval text
    constraint drop_service_subscriptions_billing_interval_check
    check (billing_interval = any (array['month'::text, 'year'::text])),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.drop_service_set_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create trigger drop_service_artisans_set_updated_at
before update on public.drop_service_artisans
for each row execute function public.drop_service_set_updated_at();

create trigger drop_service_requests_set_updated_at
before update on public.drop_service_requests
for each row execute function public.drop_service_set_updated_at();

-- No updated_at trigger exists on drop_service_subscriptions in the captured
-- production state; this baseline intentionally does not invent one.

alter table public.drop_service_artisans enable row level security;
alter table public.drop_service_requests enable row level security;
alter table public.drop_service_request_photos enable row level security;
alter table public.drop_service_subscriptions enable row level security;

create policy "drop_service_artisans_can_create_own_profile"
on public.drop_service_artisans for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "drop_service_artisans_can_update_own_profile"
on public.drop_service_artisans for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "drop_service_artisans_can_view_own_profile"
on public.drop_service_artisans for select to authenticated
using ((select auth.uid()) = user_id);

create policy "drop_service_public_can_view_active_artisans"
on public.drop_service_artisans for select to anon
using (is_active = true);

create policy "drop_service_artisans_can_view_own_requests"
on public.drop_service_requests for select to authenticated
using (exists (
  select 1 from public.drop_service_artisans a
  where a.id = drop_service_requests.artisan_id
    and a.user_id = (select auth.uid())
));

create policy "drop_service_artisans_can_update_own_requests"
on public.drop_service_requests for update to authenticated
using (exists (
  select 1 from public.drop_service_artisans a
  where a.id = drop_service_requests.artisan_id
    and a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.drop_service_artisans a
  where a.id = drop_service_requests.artisan_id
    and a.user_id = (select auth.uid())
));

create policy "drop_service_authenticated_can_submit_request"
on public.drop_service_requests for insert to authenticated
with check (
  exists (
    select 1 from public.drop_service_artisans a
    where a.id = drop_service_requests.artisan_id and a.is_active = true
  )
  and status = 'new'::text
);

create policy "drop_service_public_can_submit_request"
on public.drop_service_requests for insert to anon
with check (
  exists (
    select 1 from public.drop_service_artisans a
    where a.id = drop_service_requests.artisan_id and a.is_active = true
  )
  and status = 'new'::text
);

create policy "drop_service_artisans_can_view_own_request_photos"
on public.drop_service_request_photos for select to authenticated
using (exists (
  select 1
  from public.drop_service_requests r
  join public.drop_service_artisans a on a.id = r.artisan_id
  where r.id = drop_service_request_photos.request_id
    and a.user_id = (select auth.uid())
));

create policy "drop_service_authenticated_can_attach_photo"
on public.drop_service_request_photos for insert to authenticated
with check (true);

create policy "drop_service_public_can_attach_photo"
on public.drop_service_request_photos for insert to anon
with check (true);

create policy "artisan can read own subscription"
on public.drop_service_subscriptions for select to authenticated
using (exists (
  select 1 from public.drop_service_artisans a
  where a.id = drop_service_subscriptions.artisan_id
    and a.user_id = auth.uid()
));

-- Captured effective grants/revokes relevant to BRIF.
revoke all on public.drop_service_artisans from anon, authenticated;
grant select (id, company_name, slug, activity, service_area, logo_url, is_active)
  on public.drop_service_artisans to anon;
grant select, insert, update on public.drop_service_artisans to authenticated;

revoke all on public.drop_service_requests from anon, authenticated;
grant insert on public.drop_service_requests to anon;
grant select, insert on public.drop_service_requests to authenticated;
grant update (status) on public.drop_service_requests to authenticated;

-- Production currently retains broad table grants here; RLS policies are the
-- effective row-operation boundary captured above.
grant select, insert, update, delete, truncate, references, trigger
  on public.drop_service_request_photos to anon, authenticated;

-- Production subscription grants expose SELECT to anon/authenticated at the
-- grant layer, but RLS has no anon SELECT policy and only the own-row
-- authenticated SELECT policy. Writes are reserved to service_role.
grant select, truncate, references, trigger
  on public.drop_service_subscriptions to anon, authenticated;

-- Supabase service_role has full table privileges on all four captured tables.
grant select, insert, update, delete, truncate, references, trigger
  on public.drop_service_artisans,
     public.drop_service_requests,
     public.drop_service_request_photos,
     public.drop_service_subscriptions
  to service_role;

-- Storage bucket configuration captured from production:
-- private; 5 MiB limit; JPEG, PNG and WebP only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'drop-service-request-photos',
  'drop-service-request-photos',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
);

create policy "drop_service_public_can_upload_request_photos"
on storage.objects for insert to anon
with check (
  bucket_id = 'drop-service-request-photos'
  and (storage.foldername(name))[1] = 'requests'
);

create policy "drop_service_authenticated_can_upload_request_photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'drop-service-request-photos'
  and (storage.foldername(name))[1] = 'requests'
);

create policy "drop_service_artisans_can_read_own_request_photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'drop-service-request-photos'
  and exists (
    select 1
    from public.drop_service_request_photos p
    join public.drop_service_requests r on r.id = p.request_id
    join public.drop_service_artisans a on a.id = r.artisan_id
    where p.storage_path = objects.name
      and a.user_id = (select auth.uid())
  )
);
