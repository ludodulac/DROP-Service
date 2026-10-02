import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/telephony/phone.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("phone normalization accepts E.164 and national French form through configurable country code", () => {
  assert.equal(mod.normalizePhoneForDial("+33612345678", "+33"), "+33612345678");
  assert.equal(mod.normalizePhoneForDial("06 12 34 56 78", "+33"), "+33612345678");
  assert.equal(mod.normalizePhoneForDial("not-a-phone", "+33"), null);
});
