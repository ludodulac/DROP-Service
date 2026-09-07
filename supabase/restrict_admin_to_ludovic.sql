-- Restrict the commercial administration to Ludovic Dulac's authenticated account.
-- Applied to Supabase project nczdadkyysrxxcsnsrrn on 2026-09-07.
--
-- This is deliberately separate from admin_backoffice.sql so the original
-- back-office creation history remains intact.
-- Authorization uses the Supabase-managed top-level JWT email claim, never
-- user_metadata. owner_id isolation remains required as defense in depth.

-- Prospects

drop policy if exists "admin prospects select own" on public.drop_service_admin_prospects;
drop policy if exists "admin prospects insert own" on public.drop_service_admin_prospects;
drop policy if exists "admin prospects update own" on public.drop_service_admin_prospects;
drop policy if exists "admin prospects delete own" on public.drop_service_admin_prospects;

create policy "admin prospects select ludovic"
on public.drop_service_admin_prospects
for select to authenticated
using (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

create policy "admin prospects insert ludovic"
on public.drop_service_admin_prospects
for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

create policy "admin prospects update ludovic"
on public.drop_service_admin_prospects
for update to authenticated
using (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
)
with check (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

create policy "admin prospects delete ludovic"
on public.drop_service_admin_prospects
for delete to authenticated
using (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

-- Tasks

drop policy if exists "admin tasks select own" on public.drop_service_admin_tasks;
drop policy if exists "admin tasks insert own" on public.drop_service_admin_tasks;
drop policy if exists "admin tasks update own" on public.drop_service_admin_tasks;
drop policy if exists "admin tasks delete own" on public.drop_service_admin_tasks;

create policy "admin tasks select ludovic"
on public.drop_service_admin_tasks
for select to authenticated
using (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

create policy "admin tasks insert ludovic"
on public.drop_service_admin_tasks
for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

create policy "admin tasks update ludovic"
on public.drop_service_admin_tasks
for update to authenticated
using (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
)
with check (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);

create policy "admin tasks delete ludovic"
on public.drop_service_admin_tasks
for delete to authenticated
using (
  (select auth.uid()) = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ludodulac@gmail.com'
);
