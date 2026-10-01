import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/requests/route.ts", "utf8");

test("BRIF-144: durable request creation remains independent from notification infrastructure", () => {
  const insert = route.indexOf('.from("drop_service_requests").insert');
  const insertFailure = route.indexOf("if (insertError)", insert);
  const notification = route.indexOf("await resolveArtisanAuthEmail", insertFailure);
  const success = route.indexOf("return noStore({ requestId: requestContext.requestId }, 201)", notification);

  assert.ok(insert >= 0 && insertFailure > insert && notification > insertFailure && success > notification);
  const creationPart = route.slice(0, notification);
  assert.match(creationPart, /createPublicServerSupabaseClient\(\)/);
  assert.doesNotMatch(creationPart, /server_not_configured|status:\s*503|createPrivilegedSupabaseClient/);

  const notificationPart = route.slice(notification, success);
  assert.match(notificationPart, /artisan_request_notification_failed/);
  assert.doesNotMatch(notificationPart, /return noStore\(\{ error: .* \}, 5\d\d\)/);
});
