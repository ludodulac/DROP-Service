import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");

test("BRIF-144: request creation no longer returns 503 when privileged Supabase is unavailable", () => {
  const creationPart = route.slice(0, route.indexOf("// Notification is best-effort"));
  assert.match(creationPart, /createPublicServerSupabaseClient\(\)/);
  assert.doesNotMatch(creationPart, /server_not_configured|status:\s*503/);

  const notificationPart = route.slice(route.indexOf("// Notification is best-effort"));
  assert.match(notificationPart, /privileged_supabase_not_configured/);
  assert.match(notificationPart, /artisan_request_notification_failed/);
  assert.match(notificationPart, /return noStore\(\{ requestId: requestContext\.requestId \}, 201\)/);
});
