import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const login = readFileSync("src/app/login/page.tsx", "utf8");
const roleServer = readFileSync("src/lib/auth-role-server.ts", "utf8");
const destinationRoute = readFileSync("src/app/api/auth/destination/route.ts", "utf8");
const adminLayout = readFileSync("src/app/admin/layout.tsx", "utf8");
const dashboardLayout = readFileSync("src/app/dashboard/layout.tsx", "utf8");
const onboardingLayout = readFileSync("src/app/onboarding/layout.tsx", "utf8");
const adminRls = readFileSync("supabase/restrict_admin_to_ludovic.sql", "utf8");

test("login resolves an authenticated destination instead of forcing dashboard", () => {
  assert.match(login, /fetch\("\/api\/auth\/destination"/);
  assert.doesNotMatch(login, /router\.replace\("\/dashboard"\)/);
  assert.match(login, /router\.replace\(destination\)/);
});

test("owner routing has priority over artisan lookup", () => {
  const ownerIndex = roleServer.indexOf('=== OWNER_EMAIL');
  const artisanIndex = roleServer.indexOf('.from("drop_service_artisans")');
  assert.ok(ownerIndex >= 0);
  assert.ok(artisanIndex >= 0);
  assert.ok(ownerIndex < artisanIndex);
  assert.match(roleServer, /return "\/admin"/);
});

test("artisan and no-profile routing stay separate", () => {
  assert.match(roleServer, /return artisan \? "\/dashboard" : "\/onboarding"/);
});

test("role resolution is server-only", () => {
  assert.match(roleServer, /import "server-only"/);
  assert.doesNotMatch(login, /ludodulac@gmail\.com/);
  assert.doesNotMatch(destinationRoute, /ludodulac@gmail\.com/);
});

test("admin has a server guard that only accepts the owner destination", () => {
  assert.match(adminLayout, /resolveAuthDestination\(\)/);
  assert.match(adminLayout, /destination !== "\/admin"/);
  assert.match(adminLayout, /redirect\(destination\)/);
});

test("dashboard redirects owner and no-profile users away", () => {
  assert.match(dashboardLayout, /resolveAuthDestination\(\)/);
  assert.match(dashboardLayout, /destination !== "\/dashboard"/);
  assert.match(dashboardLayout, /redirect\(destination\)/);
});

test("onboarding is only for authenticated users without artisan profile", () => {
  assert.match(onboardingLayout, /resolveAuthDestination\(\)/);
  assert.match(onboardingLayout, /destination !== "\/onboarding"/);
  assert.match(onboardingLayout, /redirect\(destination\)/);
});

test("role endpoint is private and no-store", () => {
  assert.match(destinationRoute, /Cache-Control": "private, no-store"/);
  assert.match(destinationRoute, /authenticated: false/);
  assert.match(destinationRoute, /authenticated: true/);
});

test("existing Ludovic-only admin RLS remains unchanged in principle", () => {
  assert.match(adminRls, /auth\.jwt\(\) ->> 'email'/);
  assert.match(adminRls, /ludodulac@gmail\.com/);
  assert.match(adminRls, /\(select auth\.uid\(\)\) = owner_id/);
});
