import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const policy = readFileSync("src/lib/subscription-checkout-policy.ts", "utf8");
const route = readFileSync("src/app/api/stripe/checkout/route.ts", "utf8");
const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const stripeConfig = readFileSync("src/lib/stripe-test-server.ts", "utf8");

test("policy allows only no row, inactive, canceled and incomplete_expired", () => {
  assert.match(policy, /status === null \|\| status === undefined/);
  for (const status of ["inactive", "canceled", "incomplete_expired"]) assert.match(policy, new RegExp(`"${status}"`));
  for (const status of ["trialing", "active", "past_due", "unpaid", "paused", "incomplete"]) assert.match(policy, new RegExp(`"${status}"`));
  assert.match(policy, /checkoutAllowedSubscriptionStatuses[\s\S]*includes\(status\)/);
});

test("unknown status fails closed because only the allowlist can pass", () => {
  assert.match(policy, /return \(checkoutAllowedSubscriptionStatuses as readonly unknown\[\]\)\.includes\(status\)/);
});

test("server subscription decision happens before Stripe Checkout creation", () => {
  const lookup = route.indexOf('.from("drop_service_subscriptions")');
  const decision = route.indexOf("canStartSubscriptionCheckout", lookup);
  const create = route.indexOf("stripe.checkout.sessions.create");
  assert.ok(lookup >= 0 && decision > lookup && create > decision);
  assert.match(route, /\.eq\("artisan_id", artisan\.id\)/);
  assert.match(route, /subscription_checkout_blocked/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SECRET_KEY/);
});

test("browser authority remains interval only", () => {
  const body = route.slice(route.indexOf("let body: unknown"), route.indexOf("const stripeConfig"));
  assert.match(body, /"interval" in body/);
  assert.doesNotMatch(body, /artisan_id|price_id|subscription_status|client_reference_id/i);
});

test("month and year resolve server-side prices", () => {
  assert.match(route, /value === "month" \|\| value === "year"/);
  assert.match(stripeConfig, /interval === "month" \? monthlyPrice : yearlyPrice/);
});

test("Checkout returns to dashboard", () => {
  assert.match(route, /dashboard\?checkout=success/);
  assert.match(route, /dashboard\?checkout=cancel/);
});

test("success return is informational and never activates subscription", () => {
  assert.match(dashboard, /Paiement terminé\. Vérification de votre abonnement en cours\./);
  assert.doesNotMatch(dashboard, /checkoutReturn[\s\S]{0,200}setSubscription/);
});

test("dashboard exposes both offers only behind the shared policy", () => {
  assert.match(dashboard, /canStartSubscriptionCheckout\(subscription\?\.status\)/);
  assert.match(dashboard, /Choisir le mensuel — 39 €\/mois/);
  assert.match(dashboard, /Choisir l’annuel — 390 €\/an/);
  assert.match(dashboard, /JSON\.stringify\(\{ interval \}\)/);
});

test("dashboard does not expose Stripe identifiers", () => {
  for (const id of ["stripe_customer_id", "stripe_subscription_id", "stripe_price_id"]) assert.doesNotMatch(dashboard, new RegExp(id));
});
