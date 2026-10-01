import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261001_add_artisan_trial_window.sql", "utf8");

test("existing artisans are backfilled deterministically from original created_at", () => {
  assert.match(migration, /trial_started_at = created_at/);
  assert.match(migration, /trial_ends_at = created_at \+ interval '21 days'/);
});

test("new trial window is server-generated and immutable on profile updates", () => {
  assert.match(migration, /before insert or update on public\.drop_service_artisans/);
  assert.match(migration, /if tg_op = 'INSERT'[\s\S]*new\.trial_started_at := now\(\)/);
  assert.match(migration, /new\.trial_ends_at := now\(\) \+ interval '21 days'/);
  assert.match(migration, /new\.trial_started_at := old\.trial_started_at/);
  assert.match(migration, /new\.trial_ends_at := old\.trial_ends_at/);
  assert.match(migration, /check \(trial_ends_at = trial_started_at \+ interval '21 days'\)/);
});
