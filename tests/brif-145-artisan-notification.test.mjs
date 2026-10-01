import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");
const edgeResolver = readFileSync("supabase/functions/brif-artisan-notification-email/index.ts", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");

test("BRIF-145 resolves the linked Auth email after durable request creation", () => {
  assert.match(route, /resolveArtisanAuthEmail/);
  assert.match(edgeResolver, /\.select\("user_id"\)/);
  assert.match(edgeResolver, /auth\.admin\.getUserById/);
});

test("BRIF-145 keeps notification failure non-blocking and logged", () => {
  assert.match(route, /artisan_request_notification_failed/);
  assert.match(route, /return noStore\(\{ requestId: requestContext\.requestId \}, 201\)/);
});

test("BRIF-145 production build requires Resend and Vercel OIDC configuration without exposing values", () => {
  assert.match(nextConfig, /RESEND_API_KEY/);
  assert.match(nextConfig, /RESEND_FROM_EMAIL/);
  assert.match(nextConfig, /VERCEL_OIDC_TOKEN/);
  assert.doesNotMatch(nextConfig, /sb_secret_|re_[A-Za-z0-9]{10,}/);
});
