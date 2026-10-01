import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const onboardingPage = readFileSync("src/app/onboarding/page.tsx", "utf8");
const onboardingLayout = readFileSync("src/app/onboarding/layout.tsx", "utf8");
const roleServer = readFileSync("src/lib/auth-role-server.ts", "utf8");

test("onboarding relies on the existing server role gate instead of a second client loading gate", () => {
  assert.match(onboardingLayout, /resolveAuthDestination\(\)/);
  assert.match(onboardingLayout, /destination !== "\/onboarding"/);
  assert.match(onboardingLayout, /redirect\(destination\)/);

  assert.doesNotMatch(onboardingPage, /checking|setChecking|checkAccount|Préparation de votre espace/);
  assert.doesNotMatch(onboardingPage, /useEffect/);
});

test("authenticated non-owner users without an artisan profile still resolve to onboarding", () => {
  assert.match(roleServer, /return artisan \? "\/dashboard" : "\/onboarding"/);
});

test("onboarding form still verifies the current user before creating the artisan profile", () => {
  assert.match(onboardingPage, /supabase\.auth\.getUser\(\)/);
  assert.match(onboardingPage, /if \(!userData\.user\) \{ router\.replace\("\/login"\); return; \}/);
  assert.match(onboardingPage, /\.from\("drop_service_artisans"\)\.insert\(/);
  assert.match(onboardingPage, /router\.replace\("\/dashboard"\)/);
});
