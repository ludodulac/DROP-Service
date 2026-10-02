import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const incoming = readFileSync("src/app/api/telephony/twilio/incoming/[slug]/route.ts", "utf8");
const dial = readFileSync("src/app/api/telephony/twilio/dial-status/[slug]/route.ts", "utf8");
const provider = readFileSync("src/lib/telephony/provider.ts", "utf8");
const adapter = readFileSync("src/lib/telephony/twilio.ts", "utf8");
const state = readFileSync("src/lib/telephony/state-server.ts", "utf8");
const links = readFileSync("src/lib/telephony/links.ts", "utf8");
const config = readFileSync("src/lib/telephony/config.ts", "utf8");
const migration = readFileSync("supabase/migrations/20261002_add_telephony_calls.sql", "utf8");
const edge = readFileSync("supabase/functions/brif-telephony-state/index.ts", "utf8");
const env = readFileSync(".env.example", "utf8");

test("telephony routes use a provider abstraction and validate signatures before mutation", () => {
  assert.match(provider, /TelephonyProviderAdapter/);
  assert.match(provider, /TwilioTelephonyAdapter/);
  const incomingHandler = incoming.slice(incoming.indexOf("export async function POST"));
  const dialHandler = dial.slice(dial.indexOf("export async function POST"));
  assert.ok(incomingHandler.indexOf("adapter.validateWebhook") < incomingHandler.indexOf("registerIncomingCall"));
  assert.ok(dialHandler.indexOf("adapter.validateWebhook") < dialHandler.indexOf("completeTelephonyCall"));
});

test("incoming TwiML dials artisan phone and declares the result callback", () => {
  assert.match(incoming, /state\.artisanPhone/);
  assert.match(incoming, /normalizePhoneForDial/);
  assert.match(incoming, /dial-status/);
  assert.match(adapter, /<Dial action=/);
  assert.match(adapter, /answerOnBridge="true"/);
  assert.doesNotMatch(incoming, /06\d{8}|07\d{8}/);
});

test("missed-call link targets the public request form without preview state", () => {
  assert.match(links, /\/a\/\$\{encodeURIComponent\(slug\)\}\/request\?source=missed_call/);
  assert.doesNotMatch(links, /preview=1/);
});

test("SMS is prepared on MISSED but live emission is false unless explicitly enabled", () => {
  assert.match(config, /TELEPHONY_SMS_LIVE/);
  assert.match(config, /=== "true"/);
  assert.match(dial, /normalized\.outcome === "MISSED"/);
  assert.match(dial, /state\.smsState === "PREPARED"/);
  assert.match(dial, /config\.smsLive/);
  assert.match(dial, /adapter\.sendSms/);
});

test("persistence is private, idempotent and anti-spam", () => {
  assert.match(migration, /unique\(provider, provider_call_sid\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.drop_service_telephony_calls from public, anon, authenticated/);
  assert.match(migration, /on conflict\(provider, provider_call_sid\) do nothing/);
  assert.match(migration, /for update/);
  assert.match(migration, /previous\.caller_phone = v_call\.caller_phone/);
  assert.match(migration, /make_interval\(mins => p_sms_cooldown_minutes\)/);
  assert.match(migration, /previous\.sms_state in \('PREPARED','SENT'\)/);
});

test("internal persistence requires Vercel production OIDC before service-role access", () => {
  assert.match(state, /process\.env\.VERCEL_OIDC_TOKEN/);
  assert.match(edge, /jwtVerify\(token, jwks/);
  assert.match(edge, /payload\.project_id === PROJECT_ID/);
  assert.match(edge, /payload\.environment === "production"/);
  const verify = edge.indexOf("await verifyVercelOidc");
  const service = edge.indexOf('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
  assert.ok(verify >= 0 && service > verify);
});

test("env example exposes only telephony variable names, never concrete credentials or personal numbers", () => {
  for (const name of [
    "TELEPHONY_PROVIDER",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "TELEPHONY_SMS_LIVE",
    "TELEPHONY_SMS_COOLDOWN_MINUTES",
    "TELEPHONY_DIAL_TIMEOUT_SECONDS",
    "TELEPHONY_DEFAULT_COUNTRY_CODE",
  ]) {
    assert.match(env, new RegExp(`^${name}=$`, "m"));
  }
  assert.doesNotMatch(env, /AC[0-9a-fA-F]{32}|SK[0-9a-fA-F]{32}|\+33[1-9]\d{8}/);
});
