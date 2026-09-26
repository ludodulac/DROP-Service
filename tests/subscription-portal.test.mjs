import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const policy = readFileSync("src/lib/subscription-portal-policy.ts", "utf8");
const route = readFileSync("src/app/api/stripe/portal/route.ts", "utf8");
const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");

test("portal policy allows only manageable states and fails closed", () => {
  for (const status of ["trialing","active","past_due","unpaid","paused","incomplete"]) {
    assert.match(policy, new RegExp(`"${status}"`));
  }
  for (const status of ["inactive","canceled","incomplete_expired"]) {
    assert.match(policy, new RegExp(`"${status}"`));
  }
  assert.match(policy, /portalAllowedSubscriptionStatuses[\s\S]*includes\(status\)/);
});

test("route authenticates and resolves active artisan before subscription", () => {
  assert.ok(route.indexOf("auth.getUser()") < route.indexOf('.from("drop_service_artisans")'));
  assert.ok(route.indexOf('.from("drop_service_artisans")') < route.indexOf('.from("drop_service_subscriptions")'));
  assert.match(route, /artisan_inactive/);
});

test("own subscription under RLS supplies the only Stripe customer", () => {
  assert.match(route, /select\("status, stripe_customer_id"\)/);
  assert.match(route, /\.eq\("artisan_id", artisan\.id\)/);
  assert.match(route, /customer: subscription\.stripe_customer_id/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SECRET_KEY/);
});

test("no subscription, missing customer and blocked states stop before Stripe", () => {
  const create = route.indexOf("stripe.billingPortal.sessions.create");
  for (const token of ["subscription_not_found","subscription_portal_blocked","subscription_customer_missing"]) {
    assert.ok(route.indexOf(token) >= 0 && route.indexOf(token) < create);
  }
});

test("browser supplies no authoritative identity or return URL fields", () => {
  assert.doesNotMatch(route, /request\.json\(/);
  assert.doesNotMatch(dashboard, /JSON\.stringify\([^)]*(artisan|customer|subscription|return_url)/i);
  assert.match(dashboard, /fetch\("\/api\/stripe\/portal", \{ method: "POST" \}\)/);
});

test("portal is pinned to sandbox configuration and Preview dashboard return", () => {
  assert.match(route, /PORTAL_CONFIGURATION_ID = "bpc_/);
  assert.match(route, /PREVIEW_HOST = "brif-artisans-git-test-stripe-sandbox-checkout-ludo24\.vercel\.app"/);
  assert.match(route, /return_url: `\$\{origin\}\/dashboard`/);
  assert.match(route, /Cache-Control": "private, no-store"/);
});

test("creating a portal session does not mutate subscriptions", () => {
  assert.doesNotMatch(route, /\.update\(|\.insert\(|\.upsert\(|\.delete\(/);
  assert.match(route, /billingPortal\.sessions\.create/);
});

test("dashboard shows portal button only through portal policy", () => {
  assert.match(dashboard, /subscription && canManageSubscriptionInPortal\(subscription\.status\)/);
  assert.match(dashboard, /Gérer mon abonnement/);
  assert.match(dashboard, /canStartSubscriptionCheckout\(subscription\?\.status\)/);
});

test("dashboard exposes no Stripe identifiers", () => {
  for (const id of ["stripe_customer_id","stripe_subscription_id","stripe_price_id"]) {
    assert.doesNotMatch(dashboard, new RegExp(id));
  }
});
