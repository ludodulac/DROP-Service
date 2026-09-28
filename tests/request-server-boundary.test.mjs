import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");
const form = readFileSync("src/app/a/[slug]/request/RequestForm.tsx", "utf8");
const page = readFileSync("src/app/a/[slug]/request/page.tsx", "utf8");

test("public request creation crosses the BRIF server boundary", () => {
  assert.match(form, /fetch\("\/api\/requests"/);
  assert.doesNotMatch(form, /\.from\("drop_service_requests"\)\.insert/);
  assert.match(page, /artisanSlug=\{artisan\.slug\}/);
});

test("server resolves and validates the target artisan before creating the request", () => {
  const lookup = route.indexOf('.from("drop_service_artisans")');
  const activeCheck = route.indexOf("if (!artisan.is_active)");
  const insert = route.indexOf('.from("drop_service_requests").insert');
  assert.ok(lookup >= 0 && activeCheck > lookup && insert > activeCheck);
  assert.match(route, /\.select\("id, email, is_active"\)/);
  assert.match(route, /\.eq\("slug", slug\)/);
  assert.match(route, /artisan_not_found/);
  assert.match(route, /artisan_inactive/);
  assert.match(route, /artisan_id: requestContext\.artisanId/);
});

test("artisan email is available only in server context and never returned", () => {
  assert.match(route, /artisanEmail: artisan\.email/);
  const successResponse = route.slice(route.lastIndexOf("return noStore({ requestId"));
  assert.match(successResponse, /requestId: requestContext\.requestId/);
  assert.doesNotMatch(successResponse, /artisanEmail|artisan_email|email:/);
  assert.doesNotMatch(form, /SUPABASE_SECRET_KEY|createPrivilegedSupabaseClient/);
});

test("browser cannot choose the request artisan id", () => {
  const payloadStart = form.indexOf("body: JSON.stringify({");
  const payloadEnd = form.indexOf("}),", payloadStart);
  assert.ok(payloadStart >= 0 && payloadEnd > payloadStart);
  const payload = form.slice(payloadStart, payloadEnd);
  assert.match(payload, /slug: artisanSlug/);
  assert.doesNotMatch(payload, /artisanId|artisan_id/);
});

test("photo flow remains after successful server creation", () => {
  const requestId = form.indexOf("const requestId =");
  const upload = form.indexOf('.storage.from("drop-service-request-photos").upload');
  const photoRecord = form.indexOf('.from("drop_service_request_photos").insert');
  assert.ok(requestId >= 0 && upload > requestId && photoRecord > upload);
  assert.match(form, /requests\/\$\{artisanId\}\/\$\{requestId\}/);
  assert.match(form, /failedPhotos/);
});
