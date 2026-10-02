-- BRIF-147 — provider-independent telephony call state.
create table public.drop_service_telephony_calls (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.drop_service_artisans(id) on delete cascade,
  provider text not null check (provider in ('twilio')),
  provider_call_sid text not null,
  provider_dial_call_sid text,
  caller_phone text,
  provider_number text,
  outcome text not null default 'PENDING' check (outcome in ('PENDING','ANSWERED','MISSED','FAILED')),
  outcome_reason text not null default 'PENDING' check (outcome_reason in ('PENDING','COMPLETED','NO_ANSWER','BUSY','PROVIDER_FAILED','CANCELED','UNKNOWN')),
  provider_status text,
  sms_state text not null default 'NOT_PREPARED' check (sms_state in ('NOT_PREPARED','NOT_REQUIRED','PREPARED','SUPPRESSED','SENT','FAILED')),
  sms_link text,
  sms_provider_message_id text,
  sms_prepared_at timestamptz,
  sms_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_call_sid)
);

alter table public.drop_service_telephony_calls enable row level security;
revoke all on table public.drop_service_telephony_calls from public, anon, authenticated;

create or replace function public.drop_service_telephony_register_incoming(
  p_provider text,
  p_provider_call_sid text,
  p_slug text,
  p_caller_phone text,
  p_provider_number text
) returns table (
  call_id uuid,
  artisan_id uuid,
  artisan_slug text,
  artisan_phone text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_artisan record;
  v_call record;
begin
  if p_provider <> 'twilio'
    or nullif(btrim(p_provider_call_sid),'') is null
    or nullif(btrim(p_slug),'') is null
  then
    raise exception 'invalid telephony incoming input';
  end if;

  select a.id, a.slug, a.phone
  into v_artisan
  from public.drop_service_artisans a
  where a.slug = p_slug and a.is_active = true
  limit 1;

  if v_artisan.id is null then raise exception 'artisan not found'; end if;
  if nullif(btrim(v_artisan.phone),'') is null then raise exception 'artisan phone missing'; end if;

  insert into public.drop_service_telephony_calls(
    artisan_id, provider, provider_call_sid, caller_phone, provider_number
  ) values (
    v_artisan.id, p_provider, p_provider_call_sid, nullif(btrim(p_caller_phone),''),
    nullif(btrim(p_provider_number),'')
  )
  on conflict(provider, provider_call_sid) do nothing;

  select c.id, c.artisan_id
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = p_provider and c.provider_call_sid = p_provider_call_sid
  for update;

  if v_call.artisan_id <> v_artisan.id then
    raise exception 'telephony call artisan mismatch';
  end if;

  update public.drop_service_telephony_calls
  set
    caller_phone = coalesce(caller_phone, nullif(btrim(p_caller_phone),'')),
    provider_number = coalesce(provider_number, nullif(btrim(p_provider_number),'')),
    updated_at = now()
  where id = v_call.id;

  return query select v_call.id, v_artisan.id, v_artisan.slug, v_artisan.phone;
end;
$function$;

create or replace function public.drop_service_telephony_complete_call(
  p_provider text,
  p_provider_call_sid text,
  p_provider_dial_call_sid text,
  p_outcome text,
  p_reason text,
  p_provider_status text,
  p_sms_link text,
  p_sms_cooldown_minutes integer
) returns table (
  call_id uuid,
  sms_state text,
  caller_phone text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_call public.drop_service_telephony_calls%rowtype;
  v_sms_state text;
begin
  if p_outcome not in ('ANSWERED','MISSED','FAILED')
    or p_reason not in ('COMPLETED','NO_ANSWER','BUSY','PROVIDER_FAILED','CANCELED','UNKNOWN')
    or p_sms_cooldown_minutes < 1
    or p_sms_cooldown_minutes > 1440
  then
    raise exception 'invalid telephony completion input';
  end if;

  select *
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = p_provider and c.provider_call_sid = p_provider_call_sid
  for update;

  if v_call.id is null then raise exception 'telephony call not found'; end if;

  if v_call.outcome <> 'PENDING' then
    return query select v_call.id, v_call.sms_state, v_call.caller_phone;
    return;
  end if;

  if p_outcome = 'ANSWERED' then
    v_sms_state := 'NOT_REQUIRED';
  elsif p_outcome = 'MISSED' then
    if nullif(btrim(v_call.caller_phone),'') is null then
      v_sms_state := 'SUPPRESSED';
    elsif exists (
      select 1
      from public.drop_service_telephony_calls previous
      where previous.artisan_id = v_call.artisan_id
        and previous.id <> v_call.id
        and previous.caller_phone = v_call.caller_phone
        and previous.sms_state in ('PREPARED','SENT')
        and previous.sms_prepared_at >= now() - make_interval(mins => p_sms_cooldown_minutes)
    ) then
      v_sms_state := 'SUPPRESSED';
    else
      v_sms_state := 'PREPARED';
    end if;
  else
    v_sms_state := 'NOT_REQUIRED';
  end if;

  update public.drop_service_telephony_calls
  set
    provider_dial_call_sid = nullif(btrim(p_provider_dial_call_sid),''),
    outcome = p_outcome,
    outcome_reason = p_reason,
    provider_status = nullif(btrim(p_provider_status),''),
    sms_state = v_sms_state,
    sms_link = case when v_sms_state = 'PREPARED' then p_sms_link else sms_link end,
    sms_prepared_at = case when v_sms_state = 'PREPARED' then now() else sms_prepared_at end,
    completed_at = now(),
    updated_at = now()
  where id = v_call.id
  returning * into v_call;

  return query select v_call.id, v_call.sms_state, v_call.caller_phone;
end;
$function$;

create or replace function public.drop_service_telephony_mark_sms(
  p_provider text,
  p_provider_call_sid text,
  p_sms_state text,
  p_provider_message_id text default null
) returns table (
  call_id uuid,
  sms_state text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_call public.drop_service_telephony_calls%rowtype;
begin
  if p_sms_state not in ('SENT','FAILED') then
    raise exception 'invalid sms state';
  end if;

  select *
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = p_provider and c.provider_call_sid = p_provider_call_sid
  for update;

  if v_call.id is null then raise exception 'telephony call not found'; end if;

  if v_call.sms_state = p_sms_state then
    return query select v_call.id, v_call.sms_state;
    return;
  end if;

  if v_call.sms_state <> 'PREPARED' then
    return query select v_call.id, v_call.sms_state;
    return;
  end if;

  update public.drop_service_telephony_calls
  set
    sms_state = p_sms_state,
    sms_provider_message_id = case when p_sms_state = 'SENT' then nullif(btrim(p_provider_message_id),'') else sms_provider_message_id end,
    sms_sent_at = case when p_sms_state = 'SENT' then now() else sms_sent_at end,
    updated_at = now()
  where id = v_call.id
  returning * into v_call;

  return query select v_call.id, v_call.sms_state;
end;
$function$;

revoke all on function public.drop_service_telephony_register_incoming(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.drop_service_telephony_complete_call(text,text,text,text,text,text,text,integer) from public, anon, authenticated;
revoke all on function public.drop_service_telephony_mark_sms(text,text,text,text) from public, anon, authenticated;

grant execute on function public.drop_service_telephony_register_incoming(text,text,text,text,text) to service_role;
grant execute on function public.drop_service_telephony_complete_call(text,text,text,text,text,text,text,integer) to service_role;
grant execute on function public.drop_service_telephony_mark_sms(text,text,text,text) to service_role;
