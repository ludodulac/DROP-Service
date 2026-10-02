import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/telephony/status.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/^import type[^;]+;\s*/m, "");
const mod = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("completed and answered normalize to ANSWERED", () => {
  assert.deepEqual(mod.normalizeTwilioDialStatus("completed"), {
    outcome: "ANSWERED", reason: "COMPLETED", providerStatus: "completed",
  });
  assert.equal(mod.normalizeTwilioDialStatus("answered").outcome, "ANSWERED");
});

test("no-answer and busy normalize to MISSED with explicit reasons", () => {
  assert.deepEqual(mod.normalizeTwilioDialStatus("no-answer"), {
    outcome: "MISSED", reason: "NO_ANSWER", providerStatus: "no-answer",
  });
  assert.deepEqual(mod.normalizeTwilioDialStatus("busy"), {
    outcome: "MISSED", reason: "BUSY", providerStatus: "busy",
  });
});

test("failed and canceled normalize to FAILED", () => {
  assert.deepEqual(mod.normalizeTwilioDialStatus("failed"), {
    outcome: "FAILED", reason: "PROVIDER_FAILED", providerStatus: "failed",
  });
  assert.deepEqual(mod.normalizeTwilioDialStatus("canceled"), {
    outcome: "FAILED", reason: "CANCELED", providerStatus: "canceled",
  });
});
