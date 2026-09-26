-- BRIF Stripe TEST/LIVE environment separation.
alter table public.drop_service_subscriptions add column stripe_environment text;
alter table public.drop_service_stripe_events add column stripe_environment text;

update public.drop_service_subscriptions set stripe_environment='test'
where artisan_id='5bd024f3-c0aa-47db-8665-1eeb2cfee6ab'::uuid
and stripe_customer_id='cus_VK8PSOjOnksY6C'
and stripe_subscription_id='sub_1UJU8x3kIID3YaiqlrzCADOg'
and stripe_price_id='price_1UJAuz3kIID3YaiqKesUlEfd';

update public.drop_service_stripe_events set stripe_environment='test'
where stripe_event_id='evt_1UJVSJ3kIID3Yaiq3kNUWrkf';

do $gate$ begin
 if exists(select 1 from public.drop_service_subscriptions where stripe_environment is null) then raise exception 'ambiguous subscription environment'; end if;
 if exists(select 1 from public.drop_service_stripe_events where stripe_environment is null) then raise exception 'ambiguous stripe event environment'; end if;
end $gate$;

alter table public.drop_service_subscriptions alter column stripe_environment set not null,
 add constraint drop_service_subscriptions_stripe_environment_check check(stripe_environment in ('test','live'));
alter table public.drop_service_stripe_events alter column stripe_environment set not null,
 add constraint drop_service_stripe_events_stripe_environment_check check(stripe_environment in ('test','live'));

alter table public.drop_service_subscriptions drop constraint drop_service_subscriptions_artisan_id_key;
alter table public.drop_service_subscriptions drop constraint drop_service_subscriptions_stripe_customer_id_key;
alter table public.drop_service_subscriptions drop constraint drop_service_subscriptions_stripe_subscription_id_key;
alter table public.drop_service_subscriptions add constraint drop_service_subscriptions_artisan_environment_key unique(artisan_id,stripe_environment);
alter table public.drop_service_subscriptions add constraint drop_service_subscriptions_customer_environment_key unique(stripe_customer_id,stripe_environment);
alter table public.drop_service_subscriptions add constraint drop_service_subscriptions_subscription_environment_key unique(stripe_subscription_id,stripe_environment);
alter table public.drop_service_stripe_events drop constraint drop_service_stripe_events_pkey;
alter table public.drop_service_stripe_events add primary key(stripe_event_id,stripe_environment);

create or replace function public.drop_service_process_stripe_subscription_event(
 p_stripe_event_id text,p_event_type text,p_stripe_environment text,p_artisan_id uuid,p_stripe_customer_id text,
 p_stripe_subscription_id text,p_stripe_price_id text,p_status text,p_billing_interval text,p_current_period_end timestamptz,p_cancel_at_period_end boolean
) returns text language plpgsql security definer set search_path='' as $function$
begin
 if nullif(btrim(p_stripe_event_id),'') is null or nullif(btrim(p_event_type),'') is null or p_stripe_environment not in ('test','live')
 or p_artisan_id is null or nullif(btrim(p_stripe_customer_id),'') is null or nullif(btrim(p_stripe_subscription_id),'') is null
 or nullif(btrim(p_stripe_price_id),'') is null or p_status is null or p_billing_interval is null or p_cancel_at_period_end is null
 then raise exception 'invalid stripe subscription sync input'; end if;
 if p_status not in ('inactive','trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') then raise exception 'invalid subscription status'; end if;
 if p_billing_interval not in ('month','year') then raise exception 'invalid billing interval'; end if;

 insert into public.drop_service_stripe_events(stripe_event_id,event_type,stripe_environment)
 values(p_stripe_event_id,p_event_type,p_stripe_environment)
 on conflict(stripe_event_id,stripe_environment) do nothing;
 if not found then return 'already_processed'; end if;

 insert into public.drop_service_subscriptions(artisan_id,stripe_environment,stripe_customer_id,stripe_subscription_id,stripe_price_id,status,billing_interval,current_period_end,cancel_at_period_end,updated_at)
 values(p_artisan_id,p_stripe_environment,p_stripe_customer_id,p_stripe_subscription_id,p_stripe_price_id,p_status,p_billing_interval,p_current_period_end,p_cancel_at_period_end,now())
 on conflict(artisan_id,stripe_environment) do update set
 stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,stripe_price_id=excluded.stripe_price_id,
 status=excluded.status,billing_interval=excluded.billing_interval,current_period_end=excluded.current_period_end,
 cancel_at_period_end=excluded.cancel_at_period_end,updated_at=now();
 return 'processed';
end;$function$;

revoke all on function public.drop_service_process_stripe_subscription_event(text,text,text,uuid,text,text,text,text,text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.drop_service_process_stripe_subscription_event(text,text,text,uuid,text,text,text,text,text,timestamptz,boolean) to service_role;

-- Transitional TEST-only wrapper keeps the already deployed Preview webhook safe during migration -> deploy ordering.
create or replace function public.drop_service_process_stripe_subscription_event(
 p_stripe_event_id text,p_event_type text,p_artisan_id uuid,p_stripe_customer_id text,p_stripe_subscription_id text,
 p_stripe_price_id text,p_status text,p_billing_interval text,p_current_period_end timestamptz,p_cancel_at_period_end boolean
) returns text language sql security definer set search_path='' as $wrapper$
 select public.drop_service_process_stripe_subscription_event(p_stripe_event_id,p_event_type,'test',p_artisan_id,p_stripe_customer_id,p_stripe_subscription_id,p_stripe_price_id,p_status,p_billing_interval,p_current_period_end,p_cancel_at_period_end);
$wrapper$;
revoke all on function public.drop_service_process_stripe_subscription_event(text,text,uuid,text,text,text,text,text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.drop_service_process_stripe_subscription_event(text,text,uuid,text,text,text,text,text,timestamptz,boolean) to service_role;
