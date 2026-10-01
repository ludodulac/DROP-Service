import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");
const form = readFileSync("src/app/a/[slug]/request/RequestForm.tsx", "utf8");
const page = readFileSync("src/app/a/[slug]/request/page.tsx", "utf8");
const emailSender = readFileSync("src/lib/resend-server.ts", "utf8");
const publicServer = readFileSync("src/lib/supabase-public-server.ts", "utf8");
const emailResolver = readFileSync("src/lib/artisan-notification-email-server.ts", "utf8");
const edgeResolver = readFileSync("supabase/functions/brif-artisan-notification-email/index.ts", "utf8");

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
  const creationPart = route.slice(0, route.indexOf("try {", route.indexOf("if (insertError)")));
  assert.match(creationPart, /createPublicServerSupabaseClient\(\)/);
  assert.doesNotMatch(creationPart, /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(publicServer, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(publicServer, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
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
});

test("notification starts only after durable request creation and uses the Vercel OIDC identity", () => {
  const insertFailure = route.indexOf("if (insertError)");
  const resolver = route.indexOf("await resolveArtisanAuthEmail", insertFailure);
  const notification = route.indexOf("await sendArtisanRequestNotification", resolver);
  const success = route.indexOf("return noStore({ requestId: requestContext.requestId }, 201)", notification);
  assert.ok(insertFailure >= 0 && resolver > insertFailure && notification > resolver && success > notification);
  assert.match(route, /request\.headers\.get\("x-vercel-oidc-token"\)/);
});

test("artisan Auth email is resolved only server-to-server and never returned to the public client", () => {
  assert.match(emailResolver, /functions\/v1\/brif-artisan-notification-email/);
  assert.match(emailResolver, /Authorization: `Bearer \$\{oidcToken\}`/);
  assert.match(edgeResolver, /auth\.admin\.getUserById\(artisan\.user_id\)/);
  assert.match(edgeResolver, /return json\(\{ email \}, 200\)/);
  assert.doesNotMatch(form, /artisanAuthEmail|artisanEmail|artisan_email|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
  const successResponse = route.slice(route.lastIndexOf("return noStore({ requestId"));
  assert.doesNotMatch(successResponse, /email|artisanAuthEmail/);
});

test("edge email resolver verifies Vercel production OIDC claims before service-role access", () => {
  assert.match(edgeResolver, /jwtVerify\(token, jwks/);
  assert.match(edgeResolver, /audience: AUDIENCE/);
  assert.match(edgeResolver, /subject: SUBJECT/);
  assert.match(edgeResolver, /payload\.project_id !== PROJECT_ID/);
  assert.match(edgeResolver, /payload\.environment !== "production"/);
  const verifyIndex = edgeResolver.indexOf("jwtVerify(token, jwks");
  const serviceRoleIndex = edgeResolver.indexOf('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
  assert.ok(verifyIndex >= 0 && serviceRoleIndex > verifyIndex);
});

test("email failure remains observable but non-blocking after durable request creation", () => {
  const notification = route.indexOf("await sendArtisanRequestNotification");
  const failureLog = route.indexOf('console.error("artisan_request_notification_failed"', notification);
  const success = route.indexOf("return noStore({ requestId: requestContext.requestId }, 201)", failureLog);
  assert.ok(notification >= 0 && failureLog > notification && success > failureLog);
  assert.match(route, /artisan_request_notification_sent/);
  assert.doesNotMatch(route.slice(failureLog, success), /status:\s*500|status:\s*503/);
});

test("submit button prevents repeated manual sends while one request is in flight", () => {
  assert.match(form, /disabled=\{sending\}/);
  assert.match(form, /aria-busy=\{sending\}/);
});

test("Resend secret remains server-only", () => {
  assert.match(emailSender, /process\.env\.RESEND_API_KEY/);
  assert.match(emailSender, /process\.env\.RESEND_FROM_EMAIL/);
  assert.doesNotMatch(form, /RESEND_API_KEY|RESEND_FROM_EMAIL/);
});
