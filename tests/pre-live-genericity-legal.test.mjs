import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync("src/app/a/[slug]/request/RequestForm.tsx", "utf8");
const detail = readFileSync("src/app/dashboard/requests/[id]/page.tsx", "utf8");
const legal = readFileSync("src/app/mentions-legales/page.tsx", "utf8");
const privacy = readFileSync("src/app/confidentialite/page.tsx", "utf8");
const terms = readFileSync("src/app/conditions-generales/page.tsx", "utf8");

test("public request form uses trade-neutral categories and preserves the request fields", () => {
  for (const value of ["Dépannage / problème", "Installation / remplacement", "Entretien / intervention", "Autre demande"]) {
    assert.match(form, new RegExp(value.replace("/", "\\/")));
  }
  for (const plumbing of ["Fuite", "Chauffage", "recherche de fuite", "sous l’évier"]) {
    assert.doesNotMatch(form, new RegExp(plumbing, "i"));
  }
  for (const field of ["category", "city", "urgency", "description", "availability", "customerName", "customerPhone", "customerEmail", "photos"]) {
    assert.match(form, new RegExp(field));
  }
  assert.match(form, /from\("drop_service_requests"\)\.insert/);
});

test("existing request categories remain displayable without a new category enum", () => {
  assert.match(detail, /\{request\.category\}/);
  assert.match(detail, /category: string/);
});

test("minimal legal identity and Stripe privacy disclosure are present", () => {
  assert.match(legal, /SIREN : 811 336 205/);
  assert.match(legal, /SIRET : 811 336 205 00034/);
  assert.match(privacy, /utilise Stripe comme prestataire de paiement/);
});

test("commercial terms remain the frozen BRIF offer", () => {
  assert.match(terms, /39 € par mois/);
  assert.match(terms, /390 € par an/);
  assert.match(terms, /Aucun frais d’installation/);
  assert.match(terms, /résiliation arrête son renouvellement/);
  assert.match(terms, /n’est pas remboursée, sauf obligation légale contraire ou manquement imputable à BRIF/);
});
