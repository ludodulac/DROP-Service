-- BRIF Stripe webhook atomic subscription sync foundation.
-- Prepared only: do not apply until explicitly authorized.

create or replace function public.drop_service_process_stripe_subscription_event(
  p_stripe_event_id text,
  p_event_type text,
  p_artisan_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_billing_interval text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if nullif(btrim(p_stripe_event_id), '') is null
     or nullif(btrim(p_event_type), '') is null
     or p_artisan_id is null
     or nullif(btrim(p_stripe_customer_id), '') is null
     or nullif(btrim(p_stripe_subscription_id), '') is null
     or nullif(btrim(p_stripe_price_id), '') is null
     or p_status is null
     or p_billing_interval is null
     or p_cancel_at_period_end is null then
    raise exception 'invalid stripe subscription sync input';
  end if;

  if p_status not in (
    'inactive', 'trialing', 'active', 'past_due', 'canceled',
    'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  ) then
    raise exception 'invalid subscription status';
  end if;

  if p_billing_interval not in ('month', 'year') then
    raise exception 'invalid billing interval';
  end if;

  insert into public.drop_service_stripe_events (stripe_event_id, event_type)
  values (p_stripe_event_id, p_event_type)
  on conflict (stripe_event_id) do nothing;

  if not found then
    return 'already_processed';
  end if;

  insert into public.drop_service_subscriptions (
    artisan_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    billing_interval,
    current_period_end,
    cancel_at_period_end,
    updated_at
  )
  values (
    p_artisan_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_billing_interval,
    p_current_period_end,
    p_cancel_at_period_end,
    now()
  )
  on conflict (artisan_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    status = excluded.status,
    billing_interval = excluded.billing_interval,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  return 'processed';
end;
$function$;

revoke all on function public.drop_service_process_stripe_subscription_event(
  text, text, uuid, text, text, text, text, text, timestamptz, boolean
) from public, anon, authenticated;

grant execute on function public.drop_service_process_stripe_subscription_event(
  text, text, uuid, text, text, text, text, text, timestamptz, boolean
) to service_role;
