import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/telephony/twilio-signature.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/^import type[^;]+;\s*/m, "");
const mod = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("Twilio signature validator matches Twilio's documented HMAC-SHA1 vector", () => {
  const url = "https://example.com/myapp.php?foo=1&bar=2";
  const params = {
    CallSid: "CA1234567890ABCDE",
    Caller: "+14158675310",
    Digits: "1234",
    From: "+14158675310",
    To: "+18005551212",
  };
  assert.equal(mod.getExpectedTwilioSignature("12345", url, params), "L/OH5YylLD5NRKLltdqwSvS0BnU=");
  assert.equal(mod.validateTwilioSignature("12345", "L/OH5YylLD5NRKLltdqwSvS0BnU=", url, params), true);
  assert.equal(mod.validateTwilioSignature("12345", "invalid", url, params), false);
});

test("signature validation includes every received form parameter", () => {
  assert.match(source, /Object\.keys\(params\)\.sort\(\)/);
  assert.match(source, /formData\.entries\(\)/);
});
