import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ownerPage = readFileSync("src/app/owner/login/page.tsx", "utf8");
const ownerLayout = readFileSync("src/app/owner/login/layout.tsx", "utf8");
const adminLayout = readFileSync("src/app/admin/layout.tsx", "utf8");
const rootPage = readFileSync("src/app/page.tsx", "utf8");

test("owner has a dedicated login route with owner-only wording", () => {
  assert.match(ownerPage, /Administration BRIF/);
  assert.match(ownerPage, /Accès propriétaire/);
  assert.match(ownerPage, /Ouvrir l’administration/);
  assert.doesNotMatch(ownerPage, /Créer mon espace artisan/);
  assert.doesNotMatch(ownerPage, /href="\/signup"/);
});

test("owner login reuses Supabase Auth and routes by the existing destination resolver", () => {
  assert.match(ownerPage, /supabase\.auth\.signInWithPassword/);
  assert.match(ownerPage, /fetch\("\/api\/auth\/destination"/);
  assert.match(ownerPage, /router\.replace\(destination\)/);
});

test("an already authenticated owner or artisan never sees the owner login form", () => {
  assert.match(ownerLayout, /resolveAuthDestination\(\)/);
  assert.match(ownerLayout, /destination !== "\/login"/);
  assert.match(ownerLayout, /redirect\(destination\)/);
});

test("admin server guard remains owner-only", () => {
  assert.match(adminLayout, /resolveAuthDestination\(\)/);
  assert.match(adminLayout, /destination !== "\/admin"/);
  assert.match(adminLayout, /redirect\(destination\)/);
});

test("public root remains the artisan market landing when unauthenticated", () => {
  assert.match(rootPage, /Créer mon espace artisan/);
  assert.match(rootPage, /href="\/signup"/);
  assert.match(rootPage, /href="\/login"/);
  assert.doesNotMatch(rootPage, /owner\/login/);
});
