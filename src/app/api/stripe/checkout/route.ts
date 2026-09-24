import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
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

  // Foundation guard: deliberately stop before any Stripe API write.
  // A later, separately authorized mission may create the Checkout Session.
  return noStore({ ready: true, interval }, 200);
}
