import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const incomingPath = "src/app/api/telephony/twilio/voice/incoming/route.ts";
const resultPath = "src/app/api/telephony/twilio/voice/result/route.ts";
const incoming = readFileSync(incomingPath, "utf8");
const result = readFileSync(resultPath, "utf8");
const provider = readFileSync("src/lib/telephony/provider.ts", "utf8");
const adapter = readFileSync("src/lib/telephony/twilio.ts", "utf8");
const state = readFileSync("src/lib/telephony/state-server.ts", "utf8");
const links = readFileSync("src/lib/telephony/links.ts", "utf8");
const config = readFileSync("src/lib/telephony/config.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20261002_add_telephony_calls.sql",
  "utf8",
);
const env = readFileSync(".env.example", "utf8");

test("exact BRIF-147 webhook routes exist and legacy slug routes are removed", () => {
  assert.equal(existsSync(incomingPath), true);
  assert.equal(existsSync(resultPath), true);
  assert.equal(
    existsSync("src/app/api/telephony/twilio/incoming/[slug]/route.ts"),
    false,
  );
  assert.equal(
    existsSync("src/app/api/telephony/twilio/dial-status/[slug]/route.ts"),
    false,
  );
});

test("incoming validates signature before persistence and builds Dial result callback", () => {
  const handler = incoming.slice(incoming.indexOf("export async function POST"));
  assert.ok(
    handler.indexOf("adapter.validateWebhook") <
      handler.indexOf("registerIncomingCall"),
  );
  assert.match(incoming, /CallSid/);
  assert.match(incoming, /From/);
  assert.match(incoming, /To/);
  assert.match(incoming, /config\.twilioPhoneNumber/);
  assert.match(incoming, /state\.destinationPhone/);
  assert.match(incoming, /\/api\/telephony\/twilio\/voice\/result/);
  assert.match(adapter, /new twilio\.twiml\.VoiceResponse/);
  assert.match(adapter, /response\.dial/);
  assert.match(adapter, /answerOnBridge: true/);
});

test("invalid signature is refused before state mutation on both webhooks", () => {
  const incomingHandler = incoming.slice(
    incoming.indexOf("export async function POST"),
  );
  const resultHandler = result.slice(
    result.indexOf("export async function POST"),
  );
  assert.ok(
    incomingHandler.indexOf("adapter.validateWebhook") <
      incomingHandler.indexOf("registerIncomingCall"),
  );
  assert.ok(
    resultHandler.indexOf("adapter.validateWebhook") <
      resultHandler.indexOf("completeTelephonyCall"),
  );
  assert.match(incoming, /status: 403/);
  assert.match(result, /status: 403/);
});

test("answered creates no SMS while no-answer, busy and failed are SMS-eligible", () => {
  assert.match(
    migration,
    /if p_call_status in \('ANSWERED','CANCELED'\) then[\s\S]*?v_sms_status := 'NOT_REQUIRED'/,
  );
  assert.match(
    migration,
    /elsif p_call_status in \('MISSED','FAILED'\) then/,
  );
  assert.match(migration, /v_sms_status := 'PREPARED'/);
});

test("repeated callback cannot complete twice or send SMS twice", () => {
  assert.match(migration, /unique\(provider, provider_call_id\)/);
  assert.match(migration, /if v_call\.call_status <> 'PENDING' then/);
  assert.match(migration, /for update/);
  assert.match(migration, /sms_status <> 'PREPARED'/);
  assert.match(migration, /sms_status = 'SENDING'/);
  assert.match(result, /claimTelephonySms/);
});

test("masked caller suppresses SMS and anti-spam covers same artisan/caller", () => {
  assert.match(
    migration,
    /nullif\(btrim\(v_call\.caller_phone\),''\) is null[\s\S]*?v_sms_status := 'SUPPRESSED'/,
  );
  assert.match(migration, /previous\.artisan_id = v_call\.artisan_id/);
  assert.match(migration, /previous\.caller_phone = v_call\.caller_phone/);
  assert.match(migration, /make_interval\(mins => p_sms_cooldown_minutes\)/);
});

test("missed-call link and centralized SMS text match contract", () => {
  assert.match(links, /\/request\?source=missed_call/);
  assert.match(links, /Bonjour, je n’ai pas pu répondre à votre appel\./);
  assert.match(
    links,
    /Vous pouvez m’envoyer votre demande et des photos ici : /,
  );
});

test("TELEPHONY_SMS_LIVE false is safe default and send is gated", () => {
  assert.match(config, /TELEPHONY_SMS_LIVE/);
  assert.match(config, /=== "true"/);
  assert.match(result, /state\.smsStatus === "PREPARED" && config\.smsLive/);
  assert.match(result, /adapter\.sendSms/);
});

test("persistence contains required BRIF fields and is private", () => {
  for (const column of [
    "artisan_id",
    "provider",
    "provider_call_id",
    "caller_phone",
    "called_phone",
    "destination_phone",
    "call_status",
    "sms_status",
    "created_at",
    "processed_at",
    "error_message",
  ]) {
    assert.match(migration, new RegExp("\\b" + column + "\\b"));
  }

  assert.match(migration, /enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.drop_service_telephony_calls[\s\S]*?from public, anon, authenticated/,
  );
  assert.match(state, /createPrivilegedSupabaseClient/);
});

test("provider abstraction keeps Twilio out of BRIF domain types", () => {
  assert.match(provider, /TelephonyProviderAdapter/);
  const types = readFileSync("src/lib/telephony/types.ts", "utf8");
  assert.doesNotMatch(types, /CallSid|DialCallStatus|TWILIO_/);
});

test("env example contains names only and explicit prototype routing", () => {
  for (const name of [
    "TELEPHONY_PROVIDER",
    "TELEPHONY_ARTISAN_SLUG",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "TELEPHONY_SMS_LIVE",
    "TELEPHONY_SMS_COOLDOWN_MINUTES",
    "TELEPHONY_DIAL_TIMEOUT_SECONDS",
    "TELEPHONY_DEFAULT_COUNTRY_CODE",
  ]) {
    assert.match(env, new RegExp("^" + name + "=$", "m"));
  }

  assert.doesNotMatch(
    env,
    /AC[0-9a-fA-F]{32}|SK[0-9a-fA-F]{32}|\+33[1-9]\d{8}/,
  );
});
