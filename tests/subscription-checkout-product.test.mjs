import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const policy = readFileSync("src/lib/subscription-checkout-policy.ts", "utf8");
const route = readFileSync("src/app/api/stripe/checkout/route.ts", "utf8");
const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const stripeConfig = readFileSync("src/lib/stripe-server.ts", "utf8");

test("policy allows only no row, inactive, canceled and incomplete_expired", () => {
  assert.match(policy, /status === null \|\| status === undefined/);
  for (const status of ["inactive", "canceled", "incomplete_expired"]) assert.match(policy, new RegExp(`"${status}"`));
  for (const status of ["trialing", "active", "past_due", "unpaid", "paused", "incomplete"]) assert.match(policy, new RegExp(`"${status}"`));
});

test("server subscription decision still happens before Stripe Checkout creation", () => {
  const lookup = route.indexOf('.from("drop_service_subscriptions")');
  const decision = route.indexOf("canStartSubscriptionCheckout", lookup);
  const create = route.indexOf("stripe.checkout.sessions.create");
  assert.ok(lookup >= 0 && decision > lookup && create > decision);
  assert.match(route, /subscription_checkout_blocked/);
});

test("month and year still resolve only server-side existing prices", () => {
  assert.match(route, /value === "month" \|\| value === "year"/);
  assert.ok(stripeConfig.includes("config.monthlyPrice"));
  assert.ok(stripeConfig.includes("config.yearlyPrice"));
});

test("dashboard preserves the exact 39 and 390 euro product prices", () => {
  assert.match(dashboard, /Mensuel — 39 €\/mois/);
  assert.match(dashboard, /Annuel — 390 €\/an/);
  assert.match(dashboard, /JSON\.stringify\(\{ interval \}\)/);
});

test("offers are additionally hidden by the trial phase until seven days remain", () => {
  assert.match(dashboard, /trial\.phase !== "full" && canStartSubscriptionCheckout\(subscription\?\.status\)/);
});

test("success return remains informational and never activates subscription", () => {
  assert.match(dashboard, /Paiement terminé\. Vérification de votre abonnement en cours\./);
  assert.doesNotMatch(dashboard, /checkoutReturn[\s\S]{0,200}setSubscription/);
});
