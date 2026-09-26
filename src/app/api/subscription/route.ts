import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStripeServerConfig } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

function noStore(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  const config = getStripeServerConfig();
  if (!config) return noStore({ error: "stripe_environment_not_configured" }, 503);

  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return noStore({ error: "not_authenticated" }, 401);

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans").select("id").eq("user_id", authData.user.id).maybeSingle();
  if (artisanError) return noStore({ error: "artisan_lookup_failed" }, 500);
  if (!artisan) return noStore({ error: "artisan_not_found" }, 404);

  const { data: subscription, error } = await supabase
    .from("drop_service_subscriptions")
    .select("status, billing_interval, current_period_end, cancel_at_period_end")
    .eq("artisan_id", artisan.id)
    .eq("stripe_environment", config.environment)
    .maybeSingle();
  if (error) return noStore({ error: "subscription_lookup_failed" }, 500);
  return noStore({ subscription }, 200);
}
