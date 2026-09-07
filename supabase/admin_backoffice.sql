-- Private commercial back-office for Ludovic Dulac.
-- Applied to Supabase project nczdadkyysrxxcsnsrrn on 2026-09-07.

create table if not exists public.drop_service_admin_prospects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  city text,
  activity text,
  status text not null default 'to_review' check (status in ('to_review','approved','contacted','replied','demo','pilot','client','declined')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  why_fit text,
  draft_subject text,
  draft_email text,
  next_action text,
  next_action_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drop_service_admin_prospects enable row level security;
revoke all on table public.drop_service_admin_prospects from anon, authenticated;
grant select, insert, update, delete on table public.drop_service_admin_prospects to authenticated;

create policy "admin prospects select own" on public.drop_service_admin_prospects for select to authenticated using ((select auth.uid()) = owner_id);
create policy "admin prospects insert own" on public.drop_service_admin_prospects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "admin prospects update own" on public.drop_service_admin_prospects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "admin prospects delete own" on public.drop_service_admin_prospects for delete to authenticated using ((select auth.uid()) = owner_id);

create index if not exists drop_service_admin_prospects_owner_status_idx on public.drop_service_admin_prospects(owner_id, status);
create index if not exists drop_service_admin_prospects_owner_next_action_idx on public.drop_service_admin_prospects(owner_id, next_action_at);

create table if not exists public.drop_service_admin_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid references public.drop_service_admin_prospects(id) on delete cascade,
  title text not null,
  detail text,
  status text not null default 'todo' check (status in ('todo','done','dismissed')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drop_service_admin_tasks enable row level security;
revoke all on table public.drop_service_admin_tasks from anon, authenticated;
grant select, insert, update, delete on table public.drop_service_admin_tasks to authenticated;

create policy "admin tasks select own" on public.drop_service_admin_tasks for select to authenticated using ((select auth.uid()) = owner_id);
create policy "admin tasks insert own" on public.drop_service_admin_tasks for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "admin tasks update own" on public.drop_service_admin_tasks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "admin tasks delete own" on public.drop_service_admin_tasks for delete to authenticated using ((select auth.uid()) = owner_id);

create index if not exists drop_service_admin_tasks_owner_status_due_idx on public.drop_service_admin_tasks(owner_id, status, due_at);
