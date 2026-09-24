import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createStripeTestClient,
  getStripeTestConfig,
  type StripeTestInterval,
} from "@/lib/stripe-test-server";

export const dynamic = "force-dynamic";

function noStore(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function isStripeTestInterval(value: unknown): value is StripeTestInterval {
  return value === "month" || value === "year";
}

function getTrustedOrigin(request: Request) {
  const origin = new URL(request.url).origin;
  const expectedHost = "brif-artisans-git-test-stripe-sandbox-checkout-ludo24.vercel.app";

  return new URL(origin).host === expectedHost ? origin : null;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return noStore({ error: "not_authenticated" }, 401);
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans")
    .select("id, is_active")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (artisanError) {
    return noStore({ error: "artisan_lookup_failed" }, 500);
  }

  if (!artisan) {
    return noStore({ error: "artisan_not_found" }, 404);
  }

  if (!artisan.is_active) {
    return noStore({ error: "artisan_inactive" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore({ error: "invalid_request" }, 400);
  }

  const interval =
    typeof body === "object" && body !== null && "interval" in body
      ? (body as { interval?: unknown }).interval
      : undefined;

  if (!isStripeTestInterval(interval)) {
    return noStore({ error: "invalid_interval" }, 400);
  }

  const stripeConfig = getStripeTestConfig(interval);
  if (!stripeConfig) {
    return noStore({ error: "stripe_test_not_configured" }, 503);
  }

  const origin = getTrustedOrigin(request);
  if (!origin) {
    return noStore({ error: "invalid_checkout_origin" }, 403);
  }

  try {
    const stripe = createStripeTestClient(stripeConfig.secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripeConfig.priceId, quantity: 1 }],
      client_reference_id: artisan.id,
      subscription_data: {
        metadata: {
          brief_artisan_id: artisan.id,
        },
      },
      success_url: `${origin}/test/stripe?checkout=success`,
      cancel_url: `${origin}/test/stripe?checkout=cancelled`,
    });

    if (!session.url) {
      return noStore({ error: "checkout_url_unavailable" }, 502);
    }

    return noStore({ url: session.url }, 200);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const stripeError = error as Error & { type?: unknown; code?: unknown };
      console.error("stripe_checkout_session_failed", {
        type: typeof stripeError.type === "string" ? stripeError.type : "unknown",
        code: typeof stripeError.code === "string" ? stripeError.code : "unknown",
        message: stripeError.message,
      });
    } else {
      console.error("stripe_checkout_session_failed", {
        type: "unknown",
        code: "unknown",
        message: "Non-Error exception",
      });
    }

    return noStore({ error: "checkout_session_failed" }, 502);
  }
}
