import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");
const form = readFileSync("src/app/a/[slug]/request/RequestForm.tsx", "utf8");
const page = readFileSync("src/app/a/[slug]/request/page.tsx", "utf8");
const emailSender = readFileSync("src/lib/resend-server.ts", "utf8");
const publicServer = readFileSync("src/lib/supabase-public-server.ts", "utf8");

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
  assert.match(route, /\.select\("id, is_active"\)/);
  assert.match(route, /\.eq\("slug", slug\)/);
  assert.match(route, /artisan_not_found/);
  assert.match(route, /artisan_inactive/);
  assert.match(route, /artisan_id: requestContext\.artisanId/);
});

test("primary public request insert uses only the publishable server client and existing RLS", () => {
  const creationPart = route.slice(0, route.indexOf("// Notification is best-effort"));
  assert.match(creationPart, /createPublicServerSupabaseClient\(\)/);
  assert.doesNotMatch(creationPart, /createPrivilegedSupabaseClient\(\)/);
  assert.match(publicServer, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(publicServer, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(publicServer, /SUPABASE_SECRET_KEY|SERVICE_ROLE/);
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
  assert.match(form, /files\.length > 3/);
  assert.match(form, /5 \* 1024 \* 1024/);
  assert.match(form, /failedPhotos/);
});

test("artisan notification runs only after successful request insert and private email lookup", () => {
  const insert = route.indexOf('.from("drop_service_requests").insert');
  const insertFailure = route.indexOf("if (insertError)", insert);
  const privileged = route.indexOf("createPrivilegedSupabaseClient()", insertFailure);
  const emailLookup = route.indexOf('.select("email")', privileged);
  const notification = route.indexOf("await sendArtisanRequestNotification", emailLookup);
  const success = route.indexOf("return noStore({ requestId: requestContext.requestId }, 201)", notification);
  assert.ok(insert >= 0 && insertFailure > insert && privileged > insertFailure && emailLookup > privileged && notification > emailLookup && success > notification);
});

test("artisan private email never reaches the browser or success payload", () => {
  assert.match(route, /to: notificationArtisan\.email/);
  const successResponse = route.slice(route.lastIndexOf("return noStore({ requestId"));
  assert.match(successResponse, /requestId: requestContext\.requestId/);
  assert.doesNotMatch(successResponse, /notificationArtisan|artisanEmail|email:/);
  assert.doesNotMatch(form, /artisanEmail|artisan_email|SUPABASE_SECRET_KEY|RESEND_API_KEY|createPrivilegedSupabaseClient/);
});

test("missing privileged notification configuration is non-blocking after durable creation", () => {
  const privileged = route.indexOf("createPrivilegedSupabaseClient()");
  const missing = route.indexOf('throw new Error("privileged_supabase_not_configured")', privileged);
  const catchBlock = route.indexOf('console.error("artisan_request_notification_failed"', missing);
  const success = route.indexOf("return noStore({ requestId: requestContext.requestId }, 201)", catchBlock);
  assert.ok(privileged >= 0 && missing > privileged && catchBlock > missing && success > catchBlock);
  const afterInsert = route.slice(privileged, success);
  assert.doesNotMatch(afterInsert, /server_not_configured|return noStore\(\{ error: .* \}, 503\)/);
});

test("email failure is non-blocking after durable request creation", () => {
  const notification = route.indexOf("await sendArtisanRequestNotification");
  const catchBlock = route.indexOf('console.error("artisan_request_notification_failed"', notification);
  const success = route.indexOf("return noStore({ requestId: requestContext.requestId }, 201)", catchBlock);
  assert.ok(notification >= 0 && catchBlock > notification && success > catchBlock);
  const catchToSuccess = route.slice(catchBlock, success);
  assert.doesNotMatch(catchToSuccess, /request_create_failed|status:\s*500|status:\s*503/);
});

test("submit button prevents repeated manual sends while one request is in flight", () => {
  assert.match(form, /setSending\(true\)/);
  assert.match(form, /disabled=\{sending\}/);
  assert.match(form, /aria-busy=\{sending\}/);
});

test("Resend email contains the useful request fields", () => {
  for (const field of [
    "customerName",
    "phone",
    "customerEmail",
    "city",
    "category",
    "urgency",
    "description",
    "availability",
  ]) {
    assert.match(emailSender, new RegExp(`notification\\.${field}`));
  }
});

test("Resend secret remains server-only and is never logged or returned", () => {
  assert.match(emailSender, /process\.env\.RESEND_API_KEY/);
  assert.match(emailSender, /process\.env\.RESEND_FROM_EMAIL/);
  assert.match(emailSender, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.doesNotMatch(emailSender, /console\./);
  assert.doesNotMatch(route, /RESEND_API_KEY|RESEND_FROM_EMAIL|apiKey/);
  assert.doesNotMatch(form, /RESEND_API_KEY|RESEND_FROM_EMAIL/);
});
