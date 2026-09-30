import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rootPage = readFileSync("src/app/page.tsx", "utf8");
const loginLayout = readFileSync("src/app/login/layout.tsx", "utf8");
const roleServer = readFileSync("src/lib/auth-role-server.ts", "utf8");
const middleware = readFileSync("src/middleware.ts", "utf8");
const middlewareHelper = readFileSync("src/lib/supabase-middleware.ts", "utf8");
const browserClient = readFileSync("src/lib/supabase.ts", "utf8");
const serverClient = readFileSync("src/lib/supabase-server.ts", "utf8");

test("root redirects authenticated users through the existing role resolver", () => {
  assert.match(rootPage, /resolveAuthDestination\(\)/);
  assert.match(rootPage, /destination !== "\/login"/);
  assert.match(rootPage, /redirect\(destination\)/);
  assert.match(rootPage, /export const dynamic = "force-dynamic"/);
});

test("login redirects authenticated users before rendering the login form", () => {
  assert.match(loginLayout, /resolveAuthDestination\(\)/);
  assert.match(loginLayout, /destination !== "\/login"/);
  assert.match(loginLayout, /redirect\(destination\)/);
  assert.match(loginLayout, /return children/);
});

test("entry redirect reuses the established owner artisan onboarding destinations", () => {
  assert.match(roleServer, /return "\/admin"/);
  assert.match(roleServer, /return artisan \? "\/dashboard" : "\/onboarding"/);
  assert.match(roleServer, /return "\/login"/);
});

test("session storage and refresh implementation remain unchanged", () => {
  assert.match(browserClient, /createBrowserClient/);
  assert.match(serverClient, /createServerClient/);
  assert.match(middleware, /updateSupabaseSession/);
  assert.match(middlewareHelper, /supabase\.auth\.getClaims\(\)/);
  assert.doesNotMatch(rootPage, /signOut/);
  assert.doesNotMatch(loginLayout, /signOut/);
});
