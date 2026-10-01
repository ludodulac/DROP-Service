import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const presentation = readFileSync("src/lib/subscription-presentation.ts", "utf8");
const route = readFileSync("src/app/api/subscription/route.ts", "utf8");

test("dashboard reads subscription and persistent trial only through the server route", () => {
  assert.match(dashboard, /fetch\("\/api\/subscription", \{ cache: "no-store" \}\)/);
  assert.doesNotMatch(dashboard, /from\("drop_service_subscriptions"\)/);
  assert.match(route, /trial_started_at, trial_ends_at/);
  assert.match(route, /getTrialDisplayState/);
});

test("more-than-seven-day trial UI has no payment buttons", () => {
  const fullBlock = dashboard.slice(
    dashboard.indexOf('trial.phase === "full"'),
    dashboard.indexOf('trial.phase === "ending"'),
  );
  assert.match(fullBlock, /Votre essai BRIF est actif\./);
  assert.doesNotMatch(fullBlock, /39 €|390 €|startCheckout/);
});

test("ending and expired trial states expose the unchanged offers", () => {
  assert.match(dashboard, /trial\.phase === "ending"/);
  assert.match(dashboard, /Il vous reste \{trial\.days_remaining\}/);
  assert.match(dashboard, /Pour continuer à utiliser BRIF après votre essai/);
  assert.match(dashboard, /trial\.phase === "expired"/);
  assert.match(dashboard, /Votre période d’essai gratuite est terminée\./);
  assert.match(dashboard, /Choisissez un abonnement pour continuer avec BRIF\./);
  assert.match(dashboard, /Mensuel — 39 €\/mois/);
  assert.match(dashboard, /Annuel — 390 €\/an/);
  assert.match(dashboard, /trial\.phase !== "full"/);
});

test("current subscription replaces trial and subscribe-as-new controls", () => {
  const subscriptionBranch = dashboard.slice(
    dashboard.indexOf("subscription && canManageSubscriptionInPortal"),
    dashboard.indexOf(") : (", dashboard.indexOf("subscription && canManageSubscriptionInPortal")),
  );
  assert.match(subscriptionBranch, /subscriptionStatusLabels/);
  assert.match(subscriptionBranch, /Gérer mon abonnement/);
  assert.doesNotMatch(subscriptionBranch, /Période d’essai gratuite|Mensuel —|Annuel —/);
});

test("all supported subscription statuses retain explicit French labels", () => {
  for (const [status, label] of [
    ["inactive", "Inactif"], ["trialing", "Période d’essai"], ["active", "Actif"],
    ["past_due", "Paiement à régulariser"], ["canceled", "Résilié"],
    ["unpaid", "Paiement impayé"], ["incomplete", "Activation incomplète"],
    ["incomplete_expired", "Activation expirée"], ["paused", "En pause"],
  ]) {
    assert.match(presentation, new RegExp(status + ': "' + label + '"'));
  }
});

test("post-trial access is not gated in this mission", () => {
  assert.doesNotMatch(dashboard, /router\.(replace|push)\([^\n]*(trial|subscription|stripe)/);
});
