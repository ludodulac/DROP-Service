import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
const privileged = readFileSync("src/lib/supabase-privileged-server.ts", "utf8");
const env = readFileSync(".env.example", "utf8");

test("webhook verifies the raw body and requires Stripe signature", () => {
  const raw = route.indexOf('const rawBody = await request.text()');
  const signature = route.indexOf('request.headers.get("stripe-signature")');
  const construct = route.indexOf("stripe.webhooks.constructEvent");
  assert.ok(raw >= 0 && signature > raw && construct > signature);
  assert.doesNotMatch(route, /request\.json\s*\(/);
  assert.match(route, /if \(!signature\)[\s\S]*missing_signature[\s\S]*400/);
});

test("sandbox boundary and event allowlist are explicit", () => {
  assert.match(route, /event\.livemode !== false/);
  assert.match(route, /checkout\.session\.completed/);
  assert.match(route, /customer\.subscription\.updated/);
  assert.match(route, /customer\.subscription\.deleted/);
  assert.match(route, /!HANDLED_EVENTS\.has\(event\.type\)[\s\S]*"ignored"[\s\S]*200/);
});

test("updated and deleted events retrieve current Subscription first", () => {
  assert.match(route, /subscription = await stripe\.subscriptions\.retrieve\(subscriptionId\)/);
  assert.match(route, /event\.type === "customer\.subscription\.deleted"[\s\S]*isResourceMissing\(error\)[\s\S]*deletedSnapshot\.status === "canceled"/);
});

test("artisan identity is durable metadata and checkout correlation is checked", () => {
  assert.match(route, /subscription\.metadata\.brief_artisan_id/);
  assert.match(route, /UUID_RE\.test\(artisanId\)/);
  assert.match(route, /checkoutClientReferenceId !== validated\.artisanId/);
  assert.match(route, /\.from\("drop_service_artisans"\)[\s\S]*\.eq\("id", validated\.artisanId\)/);
  assert.match(route, /knownSubscription\.artisan_id !== validated\.artisanId/);
});

test("Price, amount, currency, interval, item count and status are validated", () => {
  assert.match(route, /subscription\.items\.data\.length !== 1/);
  assert.match(route, /price\.id === config\.monthlyPrice/);
  assert.match(route, /price\.id === config\.yearlyPrice/);
  assert.match(route, /price\.currency !== "eur"/);
  assert.match(route, /expectedAmount = isMonthly \? 3900 : 39000/);
  assert.match(route, /price\.unit_amount !== expectedAmount/);
  assert.match(route, /price\.recurring\?\.interval !== expectedInterval/);
  assert.match(route, /!ALLOWED_STATUSES\.has\(subscription\.status\)/);
});

test("RPC receives only validated server-side subscription data and handles idempotent results", () => {
  assert.match(route, /\.rpc\(\s*"drop_service_process_stripe_subscription_event"/);
  assert.match(route, /p_stripe_event_id: event\.id/);
  assert.match(route, /p_artisan_id: validated\.artisanId/);
  assert.match(route, /p_stripe_price_id: validated\.priceId/);
  assert.match(route, /rpcResult !== "processed" && rpcResult !== "already_processed"/);
  assert.match(route, /rpcError[\s\S]*database_unavailable[\s\S]*500/);
});

test("privileged Supabase client is server-only and never uses a public secret", () => {
  assert.match(privileged, /import "server-only"/);
  assert.match(privileged, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(privileged, /NEXT_PUBLIC_SUPABASE_(?:SECRET|SERVICE)/);
  assert.match(privileged, /persistSession: false/);
  assert.match(privileged, /autoRefreshToken: false/);
  assert.match(privileged, /detectSessionInUrl: false/);
});

test("only secret names are documented and responses/logs do not expose secret values", () => {
  assert.match(env, /STRIPE_TEST_WEBHOOK_SECRET=/);
  assert.match(env, /SUPABASE_SECRET_KEY=/);
  for (const line of route.split(String.fromCharCode(10)).filter((value) => value.includes("console."))) {
    assert.doesNotMatch(line, /rawBody|webhookSecret|stripeSecretKey/);
  }
  assert.doesNotMatch(route, /Authorization|cookie|email|phone/i);
});
