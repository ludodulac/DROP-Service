import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import twilio from "twilio";

const adapter = readFileSync("src/lib/telephony/twilio.ts", "utf8");

test("Twilio official SDK validates the form signature method", () => {
  const authToken = "test_auth_token";
  const url = "https://example.com/api/telephony/twilio/voice/incoming";
  const params = {
    CallSid: "CA0123456789abcdef0123456789abcdef",
    From: "+33123456789",
    To: "+33987654321",
  };

  const signature = twilio.getExpectedTwilioSignature(
    authToken,
    url,
    params,
  );

  assert.equal(
    twilio.validateRequest(authToken, signature, url, params),
    true,
  );
  assert.equal(
    twilio.validateRequest(authToken, "invalid", url, params),
    false,
  );
});

test("BRIF adapter delegates X-Twilio-Signature validation to official SDK", () => {
  assert.match(adapter, /twilio\.validateRequest\(/);
  assert.doesNotMatch(adapter, /createHmac|sha1/i);
});
