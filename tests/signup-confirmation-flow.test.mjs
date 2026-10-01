import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signup = readFileSync("src/app/signup/page.tsx", "utf8");
const confirmRoute = readFileSync("src/app/auth/confirm/route.ts", "utf8");
const roleServer = readFileSync("src/lib/auth-role-server.ts", "utf8");
const loginLayout = readFileSync("src/app/login/layout.tsx", "utf8");

test("fresh signup explicitly targets the production confirmation callback", () => {
  assert.match(signup, /const SIGNUP_CONFIRM_URL = "https:\/\/brif-artisans\.vercel\.app\/auth\/confirm";/);
  assert.match(signup, /supabase\.auth\.signUp\(\{[\s\S]*?email,[\s\S]*?password,[\s\S]*?options: \{ emailRedirectTo: SIGNUP_CONFIRM_URL \}/);
});

test("confirmation callback exchanges the PKCE auth code server-side before normal role routing", () => {
  assert.match(confirmRoute, /searchParams\.get\("code"\)/);
  assert.match(confirmRoute, /createServerSupabaseClient\(\)/);
  assert.match(confirmRoute, /supabase\.auth\.exchangeCodeForSession\(code\)/);
  assert.match(confirmRoute, /new URL\("\/login", request\.url\)/);
  assert.match(loginLayout, /resolveAuthDestination\(\)/);
  assert.match(loginLayout, /destination !== "\/login"/);
  assert.match(loginLayout, /redirect\(destination\)/);
});

test("existing role resolver still sends authenticated users without artisan profile to onboarding", () => {
  assert.match(roleServer, /return artisan \? "\/dashboard" : "\/onboarding"/);
});

test("owner and artisan routing remain unchanged", () => {
  const ownerIndex = roleServer.indexOf('=== OWNER_EMAIL');
  const artisanIndex = roleServer.indexOf('.from("drop_service_artisans")');
  assert.ok(ownerIndex >= 0 && artisanIndex >= 0 && ownerIndex < artisanIndex);
  assert.match(roleServer, /return "\/admin"/);
  assert.match(roleServer, /return artisan \? "\/dashboard" : "\/onboarding"/);
});

test("signup rate limit gets a human message instead of blaming the entered information", () => {
  assert.match(signup, /signUpError\.code === "over_email_send_rate_limit"/);
  assert.match(signup, /Une demande vient déjà d’être effectuée\. Attendez un moment avant de recommencer\./);
});

test("successful pending confirmation prevents a second immediate submit from replacing the PKCE verifier", () => {
  assert.match(signup, /setConfirmationRequested\(true\)/);
  assert.match(signup, /disabled=\{loading \|\| confirmationRequested\}/);
  assert.match(signup, /confirmationRequested \? "Email de confirmation demandé"/);
});
