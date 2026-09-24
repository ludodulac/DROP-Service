import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/stripe/checkout/route.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260924_add_drop_service_stripe_events.sql", "utf8");

test("Checkout correlates the server-resolved artisan to Session and Subscription", () => {
  assert.match(route, /client_reference_id:\s*artisan\.id/);
  assert.match(route, /brief_artisan_id:\s*artisan\.id/);
  assert.match(route, /\.eq\("user_id", authData\.user\.id\)/);
});

test("browser authority is limited to interval", () => {
  const bodySection = route.slice(route.indexOf("let body: unknown"), route.indexOf("const stripeConfig"));
  assert.match(bodySection, /"interval" in body/);
  assert.doesNotMatch(bodySection, /artisan_id|client_reference_id|customer_id|subscription_id|price_id|metadata/i);
});

test("Stripe event migration enforces unique event IDs and closed browser roles", () => {
  assert.match(migration, /stripe_event_id text primary key/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on public\.drop_service_stripe_events from anon, authenticated/i);
  assert.doesNotMatch(migration, /create\s+policy/i);
});
