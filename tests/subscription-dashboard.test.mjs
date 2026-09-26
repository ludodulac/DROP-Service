import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const presentation = readFileSync("src/lib/subscription-presentation.ts", "utf8");

test("dashboard reads only the authenticated artisan subscription through the existing browser client", () => {
  assert.match(dashboard, /from\("drop_service_subscriptions"\)/);
  assert.match(dashboard, /\.select\("status, billing_interval, current_period_end, cancel_at_period_end"\)/);
  assert.match(dashboard, /\.eq\("artisan_id", artisanData\.id\)/);
  assert.match(dashboard, /\.maybeSingle\(\)/);
  assert.doesNotMatch(dashboard, /service_role|SUPABASE_SECRET_KEY/);
});

test("all supported subscription statuses have explicit French labels", () => {
  for (const [status, label] of [
    ["inactive", "Inactif"], ["trialing", "Période d’essai"], ["active", "Actif"],
    ["past_due", "Paiement à régulariser"], ["canceled", "Résilié"],
    ["unpaid", "Paiement impayé"], ["incomplete", "Activation incomplète"],
    ["incomplete_expired", "Activation expirée"], ["paused", "En pause"],
  ]) {
    assert.match(presentation, new RegExp(status + ': "' + label + '"'));
  }
});

test("month and year have explicit labels and unknown interval is not invented", () => {
  assert.match(presentation, /interval === "month"\) return "Mensuel"/);
  assert.match(presentation, /interval === "year"\) return "Annuel"/);
  assert.match(presentation, /return null/);
});

test("active renewal and scheduled cancellation use different period wording", () => {
  assert.match(presentation, /cancel_at_period_end[\s\S]*Fin de l’abonnement prévue le/);
  assert.match(presentation, /status === "active"[\s\S]*Prochain renouvellement/);
  assert.match(presentation, /Fin de période/);
  assert.match(dashboard, /Annulation programmée/);
});

test("dashboard has an explicit no-subscription state and does not gate access", () => {
  assert.match(dashboard, /Aucun abonnement actif/);
  assert.doesNotMatch(dashboard, /router\.(replace|push)\([^\n]*subscription|router\.(replace|push)\([^\n]*stripe/);
});

test("subscription UI never selects or renders Stripe identifiers", () => {
  for (const identifier of ["stripe_customer_id", "stripe_subscription_id", "stripe_price_id"]) {
    assert.doesNotMatch(dashboard, new RegExp(identifier));
  }
});
