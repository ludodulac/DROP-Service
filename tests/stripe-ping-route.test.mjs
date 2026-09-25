import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync(
  new URL("../src/app/api/stripe/ping/route.ts", import.meta.url),
  "utf8",
);

test("ping route requires Stripe-Signature and dedicated secret", () => {
  assert.match(route, /headers\.get\("stripe-signature"\)/);
  assert.match(route, /missing_signature[\s\S]*400/);
  assert.match(route, /STRIPE_TEST_PING_WEBHOOK_SECRET/);
  assert.match(route, /server_not_configured[\s\S]*503/);
  assert.doesNotMatch(route, /STRIPE_TEST_WEBHOOK_SECRET/);
});

test("ping route verifies v2 notifications with parseEventNotification", () => {
  assert.match(route, /stripe\.parseEventNotification\([\s\S]*rawBody[\s\S]*signature[\s\S]*webhookSecret/);
  assert.match(route, /invalid_event[\s\S]*400/);
});

test("authenticated ping returns 200 and other v2 notifications are ignored", () => {
  assert.match(route, /notification\.type === "v2\.core\.event_destination\.ping"[\s\S]*result: "ping"[\s\S]*200/);
  assert.match(route, /result: "ignored"[\s\S]*200/);
});

test("ping route is isolated from BRIF business and Supabase logic", () => {
  assert.doesNotMatch(route, /supabase|\.rpc\(|subscriptions\.retrieve|checkout\.session|customer\.subscription|artisan/i);
});

test("ping route reads raw body once and never uses Snapshot constructEvent", () => {
  assert.equal(route.match(/await request\.text\(\)/g)?.length, 1);
  assert.doesNotMatch(route, /constructEvent/);
});
