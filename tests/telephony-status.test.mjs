import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/telephony/status.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText.replace(/^import type[^;]+;\s*/m, "");
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);

test("completed normalizes to ANSWERED", () => {
  assert.deepEqual(mod.normalizeTwilioDialStatus("completed"), {
    status: "ANSWERED",
    reason: "COMPLETED",
    providerStatus: "completed",
  });
});

test("no-answer and busy normalize to MISSED", () => {
  assert.deepEqual(mod.normalizeTwilioDialStatus("no-answer"), {
    status: "MISSED",
    reason: "NO_ANSWER",
    providerStatus: "no-answer",
  });
  assert.deepEqual(mod.normalizeTwilioDialStatus("busy"), {
    status: "MISSED",
    reason: "BUSY",
    providerStatus: "busy",
  });
});

test("failed and canceled retain distinct stable BRIF statuses", () => {
  assert.deepEqual(mod.normalizeTwilioDialStatus("failed"), {
    status: "FAILED",
    reason: "PROVIDER_FAILED",
    providerStatus: "failed",
  });
  assert.deepEqual(mod.normalizeTwilioDialStatus("canceled"), {
    status: "CANCELED",
    reason: "CANCELED",
    providerStatus: "canceled",
  });
});
