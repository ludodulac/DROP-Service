-- BRIF-146 — persistent 21-day artisan trial window.
alter table public.drop_service_artisans
  add column trial_started_at timestamptz,
  add column trial_ends_at timestamptz;

-- Deterministic backfill: existing artisans start from their original profile creation.
update public.drop_service_artisans
set
  trial_started_at = created_at,
  trial_ends_at = created_at + interval '21 days'
where trial_started_at is null or trial_ends_at is null;

alter table public.drop_service_artisans
  alter column trial_started_at set default now(),
  alter column trial_ends_at set default (now() + interval '21 days'),
  alter column trial_started_at set not null,
  alter column trial_ends_at set not null,
  add constraint drop_service_artisans_trial_window_check
    check (trial_ends_at = trial_started_at + interval '21 days');

create or replace function public.drop_service_lock_trial_window()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    new.trial_started_at := now();
    new.trial_ends_at := now() + interval '21 days';
  else
    new.trial_started_at := old.trial_started_at;
    new.trial_ends_at := old.trial_ends_at;
  end if;
  return new;
end;
$function$;

drop trigger if exists drop_service_artisans_lock_trial_window on public.drop_service_artisans;
create trigger drop_service_artisans_lock_trial_window
before insert or update on public.drop_service_artisans
for each row execute function public.drop_service_lock_trial_window();
