-- BRIF Stripe webhook idempotence foundation.
-- Incremental migration: do not add browser access policies.
-- The future webhook server may use service_role; anon/authenticated stay closed.

create table public.drop_service_stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.drop_service_stripe_events enable row level security;

revoke all on public.drop_service_stripe_events from anon, authenticated;
grant select, insert, update, delete on public.drop_service_stripe_events to service_role;

-- Intentionally no RLS policy for anon/authenticated.
-- Atomic event registration + subscription mutation is NOT implemented here.
