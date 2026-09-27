import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = readFileSync("src/lib/stripe-server.ts", "utf8");
const checkout = readFileSync("src/app/api/stripe/checkout/route.ts", "utf8");
const webhook = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
const portal = readFileSync("src/app/api/stripe/portal/route.ts", "utf8");
const subscription = readFileSync("src/app/api/subscription/route.ts", "utf8");
const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260926_stripe_environment_separation.sql", "utf8");
const env = readFileSync(".env.example", "utf8");

test("deployment context selects TEST for Preview, LIVE for Production and fails closed otherwise", () => {
  assert.match(config, /vercelEnv === "preview"\) return "test"/);
  assert.match(config, /vercelEnv === "production"\) return "live"/);
  assert.match(config, /return null/);
  assert.doesNotMatch(config, /NEXT_PUBLIC.*STRIPE|NEXT_PUBLIC.*ENV/);
});

test("server config keeps TEST and LIVE credentials, prices, portal and host in indivisible blocks", () => {
  for (const name of ["STRIPE_TEST_SECRET_KEY","STRIPE_TEST_PRICE_MONTHLY","STRIPE_TEST_PRICE_YEARLY","STRIPE_TEST_WEBHOOK_SECRET","STRIPE_LIVE_SECRET_KEY","STRIPE_LIVE_PRICE_MONTHLY","STRIPE_LIVE_PRICE_YEARLY","STRIPE_LIVE_WEBHOOK_SECRET","STRIPE_LIVE_PORTAL_CONFIGURATION_ID"]) {
    assert.match(config, new RegExp(name));
  }
  assert.match(config, /expectedLivemode: false/);
  assert.match(config, /expectedLivemode: true/);
  assert.match(config, /bpc_1UJvhB3kIID3Yaiqsgvjgcla/);
  assert.match(config, /brif-artisans\.vercel\.app/);
  assert.doesNotMatch(config, /drop-service-swart\.vercel\.app/);
});

test("browser cannot select environment or authoritative Stripe identifiers", () => {
  const body = checkout.slice(checkout.indexOf("let body: unknown"), checkout.indexOf("const priceId"));
  assert.match(body, /"interval" in body/);
  assert.doesNotMatch(body, /environment|livemode|price_id|customer|subscription|portal/i);
  assert.doesNotMatch(dashboard, /STRIPE_(?:TEST|LIVE)|VERCEL_ENV|stripe_environment/);
});

test("Checkout isolates subscription and price by server environment", () => {
  assert.match(checkout, /\.eq\("stripe_environment", config\.environment\)/);
  assert.match(checkout, /getStripePrice\(config, interval\)/);
  assert.match(checkout, /trustedStripeOrigin\(request, config\)/);
  assert.match(config, /return interval === "month" \? config\.monthlyPrice : config\.yearlyPrice/);
});

test("webhook enforces selected livemode, price set and RPC environment", () => {
  assert.match(webhook, /event\.livemode !== config\.expectedLivemode/);
  assert.match(webhook, /subscription\.livemode !== config\.expectedLivemode/);
  assert.match(webhook, /price\.livemode !== config\.expectedLivemode/);
  assert.match(webhook, /price\.id === config\.monthlyPrice/);
  assert.match(webhook, /price\.id === config\.yearlyPrice/);
  assert.match(webhook, /p_stripe_environment: config\.environment/);
  assert.match(webhook, /\.eq\("stripe_environment", config\.environment\)/);
});

test("Portal isolates Customer and configuration by server environment", () => {
  assert.match(portal, /\.eq\("stripe_environment", config\.environment\)/);
  assert.match(portal, /customer: subscription\.stripe_customer_id/);
  assert.match(portal, /configuration: config\.portalConfigurationId/);
  assert.match(portal, /trustedStripeOrigin\(request, config\)/);
  assert.doesNotMatch(portal, /request\.json\(/);
});

test("dashboard receives only the current server environment subscription", () => {
  assert.match(subscription, /getStripeServerConfig\(\)/);
  assert.match(subscription, /\.eq\("stripe_environment", config\.environment\)/);
  assert.match(dashboard, /fetch\("\/api\/subscription", \{ cache: "no-store" \}\)/);
  assert.doesNotMatch(dashboard, /from\("drop_service_subscriptions"\)/);
});

test("schema permits TEST and LIVE rows for one artisan and scopes Stripe identifiers", () => {
  assert.match(migration, /unique\(artisan_id,stripe_environment\)/);
  assert.match(migration, /unique\(stripe_customer_id,stripe_environment\)/);
  assert.match(migration, /unique\(stripe_subscription_id,stripe_environment\)/);
  assert.match(migration, /stripe_environment in \('test','live'\)/);
});

test("event idempotence is environment-scoped", () => {
  assert.match(migration, /primary key\(stripe_event_id,stripe_environment\)/);
  assert.match(migration, /on conflict\(stripe_event_id,stripe_environment\) do nothing/);
});

test("RPC writes and upserts only artisan plus environment atomically", () => {
  assert.match(migration, /p_stripe_environment text/);
  assert.match(migration, /values\(p_artisan_id,p_stripe_environment/);
  assert.match(migration, /on conflict\(artisan_id,stripe_environment\) do update set/);
  assert.doesNotMatch(migration, /exception\s+when/i);
  assert.doesNotMatch(migration, /commit|rollback/i);
});

test("historical Serrurerie Martin subscription and event are deterministically classified TEST", () => {
  assert.match(migration, /5bd024f3-c0aa-47db-8665-1eeb2cfee6ab/);
  assert.match(migration, /sub_1UJU8x3kIID3YaiqlrzCADOg/);
  assert.match(migration, /evt_1UJVSJ3kIID3Yaiq3kNUWrkf/);
  assert.match(migration, /set stripe_environment='test'/);
  assert.match(migration, /ambiguous subscription environment/);
  assert.match(migration, /ambiguous stripe event environment/);
});

test("LIVE variable names are server-only documentation, never public", () => {
  for (const name of ["STRIPE_LIVE_SECRET_KEY","STRIPE_LIVE_PRICE_MONTHLY","STRIPE_LIVE_PRICE_YEARLY","STRIPE_LIVE_WEBHOOK_SECRET","STRIPE_LIVE_PORTAL_CONFIGURATION_ID"]) assert.match(env, new RegExp(name + "="));
  assert.doesNotMatch(env, /NEXT_PUBLIC_STRIPE/);
});
