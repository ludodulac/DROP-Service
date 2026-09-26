import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { canManageSubscriptionInPortal } from "@/lib/subscription-portal-policy";
import { createStripeTestClient, getStripeTestSecretKey } from "@/lib/stripe-test-server";

export const dynamic = "force-dynamic";

const PORTAL_CONFIGURATION_ID = "bpc_1UJvhB3kIID3Yaiqsgvjgcla";
const PREVIEW_HOST = "brif-artisans-git-test-stripe-sandbox-checkout-ludo24.vercel.app";

function noStore(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function getTrustedOrigin(request: Request) {
  const origin = new URL(request.url).origin;
  return new URL(origin).host === PREVIEW_HOST ? origin : null;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return noStore({ error: "not_authenticated" }, 401);

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans").select("id, is_active")
    .eq("user_id", authData.user.id).maybeSingle();
  if (artisanError) return noStore({ error: "artisan_lookup_failed" }, 500);
  if (!artisan) return noStore({ error: "artisan_not_found" }, 404);
  if (!artisan.is_active) return noStore({ error: "artisan_inactive" }, 403);

  const { data: subscription, error: subscriptionError } = await supabase
    .from("drop_service_subscriptions").select("status, stripe_customer_id")
    .eq("artisan_id", artisan.id).maybeSingle();
  if (subscriptionError) return noStore({ error: "subscription_lookup_failed" }, 500);
  if (!subscription) return noStore({ error: "subscription_not_found" }, 404);
  if (!canManageSubscriptionInPortal(subscription.status)) {
    return noStore({ error: "subscription_portal_blocked" }, 409);
  }
  if (!subscription.stripe_customer_id) return noStore({ error: "subscription_customer_missing" }, 409);

  const origin = getTrustedOrigin(request);
  if (!origin) return noStore({ error: "invalid_portal_origin" }, 403);
  const secretKey = getStripeTestSecretKey();
  if (!secretKey) return noStore({ error: "stripe_test_not_configured" }, 503);

  try {
    const stripe = createStripeTestClient(secretKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      configuration: PORTAL_CONFIGURATION_ID,
      return_url: `${origin}/dashboard`,
    });
    return noStore({ url: session.url }, 200);
  } catch (error: unknown) {
    const stripeError = error instanceof Error ? (error as Error & { type?: unknown; code?: unknown }) : null;
    console.error("stripe_portal_session_failed", {
      type: stripeError && typeof stripeError.type === "string" ? stripeError.type : "unknown",
      code: stripeError && typeof stripeError.code === "string" ? stripeError.code : "unknown",
    });
    return noStore({ error: "portal_session_failed" }, 502);
  }
}
