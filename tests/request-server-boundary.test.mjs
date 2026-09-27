import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");
const form = readFileSync("src/app/a/[slug]/request/RequestForm.tsx", "utf8");

test("valid public requests are created server-side for the validated artisan", () => {
  assert.match(route, /createPrivilegedSupabaseClient\(\)/);
  assert.match(route, /\.from\("drop_service_artisans"\)/);
  assert.match(route, /\.eq\("id", artisanId\)/);
  assert.match(route, /artisan\.is_active !== true/);
  assert.match(route, /\.from\("drop_service_requests"\)\.insert/);
  assert.match(route, /artisan_id: artisan\.id/);
  assert.match(route, /status: "new"/);
  assert.match(route, /request_id: requestId/);
});

test("missing or inactive artisans are refused before request creation", () => {
  const validation = route.indexOf('artisan.is_active !== true');
  const insert = route.indexOf('.from("drop_service_requests").insert');
  assert.ok(validation >= 0 && insert > validation);
  assert.match(route, /artisan_not_found/);
});

test("artisan email stays server-only and is never returned to the browser", () => {
  assert.match(route, /select\("id, email, is_active"\)/);
  assert.match(route, /artisan_email: artisan\.email/);
  assert.doesNotMatch(form, /artisanEmail|artisan_email/);
  assert.doesNotMatch(route, /Response\.json\(\{[^}]*artisan_email/s);
  assert.match(route, /Response\.json\(\{ request_id: requestId \}/);
});

test("form behavior and photo flow remain client-compatible after server creation", () => {
  assert.match(form, /fetch\("\/api\/requests"/);
  assert.doesNotMatch(form, /from\("drop_service_requests"\)\.insert/);
  assert.match(form, /const files = form\.getAll\("photos"\)/);
  assert.match(form, /drop-service-request-photos/);
  assert.match(form, /from\("drop_service_request_photos"\)\.insert/);
  assert.match(form, /request_id: requestId/);
  assert.match(form, /setSuccess\(true\)/);
});
