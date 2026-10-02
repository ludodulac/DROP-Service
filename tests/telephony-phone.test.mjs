import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/telephony/phone.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);

test("normalizes French local and international phone numbers", () => {
  assert.equal(mod.normalizePhoneForDial("06 12 34 56 78"), "+33612345678");
  assert.equal(mod.normalizePhoneForDial("0033 6 12 34 56 78"), "+33612345678");
  assert.equal(mod.normalizePhoneForDial("+33612345678"), "+33612345678");
});

test("masked or unusable callers cannot become SMS recipients", () => {
  for (const value of [
    "",
    "anonymous",
    "restricted",
    "private",
    "unknown",
    "unavailable",
    "not-a-phone",
  ]) {
    assert.equal(mod.normalizePhoneForDial(value), null);
  }
  assert.equal(mod.normalizePhoneForDial(null), null);
});
