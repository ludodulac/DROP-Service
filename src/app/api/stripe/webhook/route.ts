import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createPrivilegedSupabaseClient } from "@/lib/supabase-privileged-server";
import { createStripeTestClient } from "@/lib/stripe-test-server";

export const dynamic = "force-dynamic";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

const ALLOWED_STATUSES = new Set([
  "inactive",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function response(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function logWebhookError(category: string, eventType?: string, code?: string) {
  console.error("stripe_webhook_error", {
    category,
    eventType: eventType || "unknown",
    code: code || "unknown",
  });
}

function getServerConfig() {
  const stripeSecretKey = process.env.STRIPE_TEST_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
  const monthlyPrice = process.env.STRIPE_TEST_PRICE_MONTHLY;
  const yearlyPrice = process.env.STRIPE_TEST_PRICE_YEARLY;

  if (!stripeSecretKey || !webhookSecret || !monthlyPrice || !yearlyPrice) {
    return null;
  }

  return { stripeSecretKey, webhookSecret, monthlyPrice, yearlyPrice };
}

function stripeId(value: string | { id: string } | null): string | null {
  if (typeof value === "string") return value;
  return value?.id || null;
}

function isResourceMissing(error: unknown) {
  if (!(error instanceof Error)) return false;
  const stripeError = error as Error & { code?: unknown; type?: unknown };
  return (
    stripeError.code === "resource_missing" &&
    stripeError.type === "StripeInvalidRequestError"
  );
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };
  if (typeof subscriptionWithPeriod.current_period_end === "number") {
    return subscriptionWithPeriod.current_period_end;
  }

  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_end?: number;
  };
  return typeof item?.current_period_end === "number"
    ? item.current_period_end
    : null;
}

function validateSubscription(
  subscription: Stripe.Subscription,
  config: { monthlyPrice: string; yearlyPrice: string },
) {
  if (subscription.livemode !== false) return null;
  if (subscription.items.data.length !== 1) return null;

  const item = subscription.items.data[0];
  const price = item.price;
  const isMonthly = price.id === config.monthlyPrice;
  const isYearly = price.id === config.yearlyPrice;

  if (!isMonthly && !isYearly) return null;
  if (price.livemode !== false || price.currency !== "eur") return null;

  const expectedAmount = isMonthly ? 3900 : 39000;
  const expectedInterval = isMonthly ? "month" : "year";
  if (
    price.unit_amount !== expectedAmount ||
    price.recurring?.interval !== expectedInterval
  ) {
    return null;
  }

  if (!ALLOWED_STATUSES.has(subscription.status)) return null;

  const artisanId = subscription.metadata.brief_artisan_id;
  if (!artisanId || !UUID_RE.test(artisanId)) return null;

  const customerId = stripeId(subscription.customer);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);
  if (!customerId || currentPeriodEnd === null) return null;

  return {
    artisanId,
    customerId,
    subscriptionId: subscription.id,
    priceId: price.id,
    status: subscription.status,
    billingInterval: expectedInterval,
    currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return response({ error: "missing_signature" }, 400);
  }

  const config = getServerConfig();
  const supabase = createPrivilegedSupabaseClient();
  if (!config || !supabase) {
    logWebhookError("server_not_configured");
    return response({ error: "server_not_configured" }, 503);
  }

  const stripe = createStripeTestClient(config.stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.webhookSecret,
    );
  } catch (error: unknown) {
    const code =
      error instanceof Error &&
      typeof (error as Error & { code?: unknown }).code === "string"
        ? String((error as Error & { code?: unknown }).code)
        : undefined;
    logWebhookError("invalid_signature", undefined, code);
    return response({ error: "invalid_signature" }, 400);
  }

  if (event.livemode !== false) {
    logWebhookError("invalid_livemode", event.type);
    return response({ error: "invalid_livemode" }, 400);
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return response({ received: true, result: "ignored" }, 200);
  }

  let subscriptionId: string | null = null;
  let checkoutClientReferenceId: string | null = null;
  let deletedSnapshot: Stripe.Subscription | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") {
      logWebhookError("invalid_checkout_mode", event.type);
      return response({ error: "invalid_event_data" }, 422);
    }
    subscriptionId = stripeId(session.subscription);
    checkoutClientReferenceId = session.client_reference_id;
    if (!subscriptionId || !checkoutClientReferenceId) {
      logWebhookError("missing_checkout_correlation", event.type);
      return response({ error: "invalid_event_data" }, 422);
    }
  } else {
    const snapshot = event.data.object as Stripe.Subscription;
    subscriptionId = snapshot.id || null;
    if (event.type === "customer.subscription.deleted") {
      deletedSnapshot = snapshot;
    }
  }

  if (!subscriptionId) {
    logWebhookError("missing_subscription_id", event.type);
    return response({ error: "invalid_event_data" }, 422);
  }

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error: unknown) {
    if (
      event.type === "customer.subscription.deleted" &&
      deletedSnapshot &&
      isResourceMissing(error) &&
      deletedSnapshot.status === "canceled"
    ) {
      subscription = deletedSnapshot;
    } else {
      const code =
        error instanceof Error &&
        typeof (error as Error & { code?: unknown }).code === "string"
          ? String((error as Error & { code?: unknown }).code)
          : undefined;
      logWebhookError("subscription_retrieve_failed", event.type, code);
      return response({ error: "stripe_unavailable" }, 503);
    }
  }

  const validated = validateSubscription(subscription, config);
  if (!validated) {
    logWebhookError("invalid_subscription_data", event.type);
    return response({ error: "invalid_subscription_data" }, 422);
  }

  if (
    checkoutClientReferenceId &&
    checkoutClientReferenceId !== validated.artisanId
  ) {
    logWebhookError("checkout_artisan_mismatch", event.type);
    return response({ error: "artisan_mismatch" }, 422);
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans")
    .select("id")
    .eq("id", validated.artisanId)
    .maybeSingle();

  if (artisanError) {
    logWebhookError("artisan_lookup_failed", event.type);
    return response({ error: "database_unavailable" }, 500);
  }
  if (!artisan) {
    logWebhookError("artisan_not_found", event.type);
    return response({ error: "invalid_subscription_data" }, 422);
  }

  const { data: knownSubscription, error: knownError } = await supabase
    .from("drop_service_subscriptions")
    .select("artisan_id")
    .eq("stripe_subscription_id", validated.subscriptionId)
    .maybeSingle();

  if (knownError) {
    logWebhookError("subscription_lookup_failed", event.type);
    return response({ error: "database_unavailable" }, 500);
  }
  if (
    knownSubscription &&
    knownSubscription.artisan_id !== validated.artisanId
  ) {
    logWebhookError("known_subscription_artisan_mismatch", event.type);
    return response({ error: "artisan_mismatch" }, 422);
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "drop_service_process_stripe_subscription_event",
    {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_artisan_id: validated.artisanId,
      p_stripe_customer_id: validated.customerId,
      p_stripe_subscription_id: validated.subscriptionId,
      p_stripe_price_id: validated.priceId,
      p_status: validated.status,
      p_billing_interval: validated.billingInterval,
      p_current_period_end: validated.currentPeriodEnd,
      p_cancel_at_period_end: validated.cancelAtPeriodEnd,
    },
  );

  if (rpcError) {
    logWebhookError("rpc_failed", event.type);
    return response({ error: "database_unavailable" }, 500);
  }

  if (rpcResult !== "processed" && rpcResult !== "already_processed") {
    logWebhookError("unexpected_rpc_result", event.type);
    return response({ error: "unexpected_server_result" }, 500);
  }

  console.info("stripe_webhook_processed", {
    eventType: event.type,
    result: rpcResult,
  });
  return response({ received: true, result: rpcResult }, 200);
}
