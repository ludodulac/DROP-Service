import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/trial-state.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const trialModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const { getTrialDisplayState, TRIAL_DURATION_DAYS, TRIAL_OFFER_THRESHOLD_DAYS } = trialModule;

const started = "2026-01-01T00:00:00.000Z";
const ends = "2026-01-22T00:00:00.000Z";

test("trial duration and offer threshold are fixed at 21 and 7 days", () => {
  assert.equal(TRIAL_DURATION_DAYS, 21);
  assert.equal(TRIAL_OFFER_THRESHOLD_DAYS, 7);
});

test("trial start has no subscription offer phase", () => {
  assert.deepEqual(getTrialDisplayState(started, ends, new Date(started)), {
    started_at: started,
    ends_at: ends,
    phase: "full",
    days_remaining: 21,
  });
});

test("more than seven days remaining stays in full trial phase", () => {
  const state = getTrialDisplayState(started, ends, new Date("2026-01-14T23:59:59.000Z"));
  assert.equal(state.phase, "full");
  assert.equal(state.days_remaining, 8);
});

test("exactly seven days remaining reveals the ending phase", () => {
  const state = getTrialDisplayState(started, ends, new Date("2026-01-15T00:00:00.000Z"));
  assert.equal(state.phase, "ending");
  assert.equal(state.days_remaining, 7);
});

test("one day remaining remains in ending phase", () => {
  const state = getTrialDisplayState(started, ends, new Date("2026-01-21T00:00:00.000Z"));
  assert.equal(state.phase, "ending");
  assert.equal(state.days_remaining, 1);
});

test("exact trial end is expired", () => {
  const state = getTrialDisplayState(started, ends, new Date(ends));
  assert.equal(state.phase, "expired");
  assert.equal(state.days_remaining, 0);
});

test("after trial end remains expired", () => {
  const state = getTrialDisplayState(started, ends, new Date("2026-01-23T12:00:00.000Z"));
  assert.equal(state.phase, "expired");
  assert.equal(state.days_remaining, 0);
});
