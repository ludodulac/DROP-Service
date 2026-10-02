-- BRIF-147 — provider-independent telephony call state.
create table public.drop_service_telephony_calls (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.drop_service_artisans(id) on delete cascade,
  provider text not null,
  provider_call_id text not null,
  provider_leg_call_id text,
  caller_phone text,
  called_phone text not null,
  destination_phone text not null,
  call_status text not null default 'PENDING'
    check (call_status in ('PENDING','ANSWERED','MISSED','FAILED','CANCELED')),
  call_reason text not null default 'PENDING'
    check (call_reason in ('PENDING','COMPLETED','NO_ANSWER','BUSY','PROVIDER_FAILED','CANCELED','UNKNOWN')),
  provider_status text,
  sms_status text not null default 'NOT_PREPARED'
    check (sms_status in ('NOT_PREPARED','NOT_REQUIRED','PREPARED','SUPPRESSED','SENDING','SENT','FAILED')),
  sms_link text,
  sms_provider_message_id text,
  sms_prepared_at timestamptz,
  sms_sent_at timestamptz,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_call_id)
);

create index drop_service_telephony_calls_artisan_caller_sms_idx
  on public.drop_service_telephony_calls(
    artisan_id,
    caller_phone,
    sms_prepared_at desc
  )
  where sms_status in ('PREPARED','SENDING','SENT');

alter table public.drop_service_telephony_calls enable row level security;
revoke all on table public.drop_service_telephony_calls
  from public, anon, authenticated;

create or replace function public.drop_service_telephony_register_incoming(
  p_provider text,
  p_provider_call_id text,
  p_artisan_slug text,
  p_caller_phone text,
  p_called_phone text,
  p_sms_link text
) returns table (
  call_id uuid,
  artisan_id uuid,
  artisan_slug text,
  destination_phone text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_artisan record;
  v_call public.drop_service_telephony_calls%rowtype;
begin
  if nullif(btrim(p_provider),'') is null
    or nullif(btrim(p_provider_call_id),'') is null
    or nullif(btrim(p_artisan_slug),'') is null
    or nullif(btrim(p_called_phone),'') is null
    or nullif(btrim(p_sms_link),'') is null
  then
    raise exception 'invalid telephony incoming input';
  end if;

  select a.id, a.slug, a.phone
  into v_artisan
  from public.drop_service_artisans a
  where a.slug = p_artisan_slug
    and a.is_active = true
  limit 1;

  if v_artisan.id is null then
    raise exception 'artisan not found';
  end if;

  if nullif(btrim(v_artisan.phone),'') is null then
    raise exception 'artisan phone missing';
  end if;

  insert into public.drop_service_telephony_calls(
    artisan_id,
    provider,
    provider_call_id,
    caller_phone,
    called_phone,
    destination_phone,
    sms_link
  ) values (
    v_artisan.id,
    btrim(p_provider),
    btrim(p_provider_call_id),
    nullif(btrim(p_caller_phone),''),
    btrim(p_called_phone),
    btrim(v_artisan.phone),
    btrim(p_sms_link)
  )
  on conflict(provider, provider_call_id) do nothing;

  select *
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = btrim(p_provider)
    and c.provider_call_id = btrim(p_provider_call_id)
  for update;

  if v_call.id is null then
    raise exception 'telephony call not found after registration';
  end if;

  if v_call.artisan_id <> v_artisan.id
    or v_call.called_phone <> btrim(p_called_phone)
  then
    raise exception 'telephony call routing mismatch';
  end if;

  update public.drop_service_telephony_calls
  set
    caller_phone = coalesce(
      caller_phone,
      nullif(btrim(p_caller_phone),'')
    ),
    sms_link = coalesce(sms_link, nullif(btrim(p_sms_link),'')),
    updated_at = now()
  where id = v_call.id
  returning * into v_call;

  return query
  select
    v_call.id,
    v_artisan.id,
    v_artisan.slug,
    v_call.destination_phone;
end;
$function$;

create or replace function public.drop_service_telephony_complete_call(
  p_provider text,
  p_provider_call_id text,
  p_provider_leg_call_id text,
  p_call_status text,
  p_call_reason text,
  p_provider_status text,
  p_sms_cooldown_minutes integer
) returns table (
  call_id uuid,
  call_status text,
  sms_status text,
  caller_phone text,
  sms_link text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_call public.drop_service_telephony_calls%rowtype;
  v_sms_status text;
begin
  if p_call_status not in ('ANSWERED','MISSED','FAILED','CANCELED')
    or p_call_reason not in ('COMPLETED','NO_ANSWER','BUSY','PROVIDER_FAILED','CANCELED','UNKNOWN')
    or p_sms_cooldown_minutes < 1
    or p_sms_cooldown_minutes > 1440
  then
    raise exception 'invalid telephony completion input';
  end if;

  select *
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = p_provider
    and c.provider_call_id = p_provider_call_id
  for update;

  if v_call.id is null then
    raise exception 'telephony call not found';
  end if;

  if v_call.call_status <> 'PENDING' then
    return query
    select
      v_call.id,
      v_call.call_status,
      v_call.sms_status,
      v_call.caller_phone,
      v_call.sms_link;
    return;
  end if;

  if p_call_status in ('ANSWERED','CANCELED') then
    v_sms_status := 'NOT_REQUIRED';
  elsif p_call_status in ('MISSED','FAILED') then
    if nullif(btrim(v_call.caller_phone),'') is null
      or nullif(btrim(v_call.sms_link),'') is null
    then
      v_sms_status := 'SUPPRESSED';
    elsif exists (
      select 1
      from public.drop_service_telephony_calls previous
      where previous.artisan_id = v_call.artisan_id
        and previous.id <> v_call.id
        and previous.caller_phone = v_call.caller_phone
        and previous.sms_status in ('PREPARED','SENDING','SENT')
        and previous.sms_prepared_at >=
          now() - make_interval(mins => p_sms_cooldown_minutes)
    ) then
      v_sms_status := 'SUPPRESSED';
    else
      v_sms_status := 'PREPARED';
    end if;
  else
    v_sms_status := 'NOT_REQUIRED';
  end if;

  update public.drop_service_telephony_calls
  set
    provider_leg_call_id = nullif(btrim(p_provider_leg_call_id),''),
    call_status = p_call_status,
    call_reason = p_call_reason,
    provider_status = nullif(btrim(p_provider_status),''),
    sms_status = v_sms_status,
    sms_prepared_at = case
      when v_sms_status = 'PREPARED' then now()
      else sms_prepared_at
    end,
    processed_at = now(),
    updated_at = now()
  where id = v_call.id
  returning * into v_call;

  return query
  select
    v_call.id,
    v_call.call_status,
    v_call.sms_status,
    v_call.caller_phone,
    v_call.sms_link;
end;
$function$;

create or replace function public.drop_service_telephony_claim_sms(
  p_provider text,
  p_provider_call_id text
) returns table (
  call_id uuid,
  claimed boolean,
  caller_phone text,
  sms_link text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_call public.drop_service_telephony_calls%rowtype;
begin
  select *
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = p_provider
    and c.provider_call_id = p_provider_call_id
  for update;

  if v_call.id is null then
    raise exception 'telephony call not found';
  end if;

  if v_call.sms_status <> 'PREPARED' then
    return query
    select v_call.id, false, v_call.caller_phone, v_call.sms_link;
    return;
  end if;

  update public.drop_service_telephony_calls
  set
    sms_status = 'SENDING',
    updated_at = now()
  where id = v_call.id
  returning * into v_call;

  return query
  select v_call.id, true, v_call.caller_phone, v_call.sms_link;
end;
$function$;

create or replace function public.drop_service_telephony_mark_sms(
  p_provider text,
  p_provider_call_id text,
  p_sms_status text,
  p_provider_message_id text default null,
  p_error_message text default null
) returns table (
  call_id uuid,
  sms_status text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_call public.drop_service_telephony_calls%rowtype;
begin
  if p_sms_status not in ('SENT','FAILED') then
    raise exception 'invalid sms status';
  end if;

  select *
  into v_call
  from public.drop_service_telephony_calls c
  where c.provider = p_provider
    and c.provider_call_id = p_provider_call_id
  for update;

  if v_call.id is null then
    raise exception 'telephony call not found';
  end if;

  if v_call.sms_status = p_sms_status then
    return query select v_call.id, v_call.sms_status;
    return;
  end if;

  if v_call.sms_status <> 'SENDING' then
    return query select v_call.id, v_call.sms_status;
    return;
  end if;

  update public.drop_service_telephony_calls
  set
    sms_status = p_sms_status,
    sms_provider_message_id = case
      when p_sms_status = 'SENT'
        then nullif(btrim(p_provider_message_id),'')
      else sms_provider_message_id
    end,
    sms_sent_at = case
      when p_sms_status = 'SENT' then now()
      else sms_sent_at
    end,
    error_message = case
      when p_sms_status = 'FAILED'
        then left(coalesce(nullif(btrim(p_error_message),''), 'sms_send_failed'), 500)
      else error_message
    end,
    updated_at = now()
  where id = v_call.id
  returning * into v_call;

  return query select v_call.id, v_call.sms_status;
end;
$function$;

create or replace function public.drop_service_telephony_record_error(
  p_provider text,
  p_provider_call_id text,
  p_error_message text
) returns table (
  call_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_call_id uuid;
begin
  update public.drop_service_telephony_calls
  set
    error_message = left(
      coalesce(nullif(btrim(p_error_message),''), 'telephony_error'),
      500
    ),
    updated_at = now()
  where provider = p_provider
    and provider_call_id = p_provider_call_id
  returning id into v_call_id;

  if v_call_id is null then
    raise exception 'telephony call not found';
  end if;

  return query select v_call_id;
end;
$function$;

revoke all on function public.drop_service_telephony_register_incoming(
  text,text,text,text,text,text
) from public, anon, authenticated;
revoke all on function public.drop_service_telephony_complete_call(
  text,text,text,text,text,text,integer
) from public, anon, authenticated;
revoke all on function public.drop_service_telephony_claim_sms(
  text,text
) from public, anon, authenticated;
revoke all on function public.drop_service_telephony_mark_sms(
  text,text,text,text,text
) from public, anon, authenticated;
revoke all on function public.drop_service_telephony_record_error(
  text,text,text
) from public, anon, authenticated;

grant execute on function public.drop_service_telephony_register_incoming(
  text,text,text,text,text,text
) to service_role;
grant execute on function public.drop_service_telephony_complete_call(
  text,text,text,text,text,text,integer
) to service_role;
grant execute on function public.drop_service_telephony_claim_sms(
  text,text
) to service_role;
grant execute on function public.drop_service_telephony_mark_sms(
  text,text,text,text,text
) to service_role;
grant execute on function public.drop_service_telephony_record_error(
  text,text,text
) to service_role;
