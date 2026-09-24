import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260924_add_atomic_stripe_subscription_sync.sql", "utf8");

test("RPC atomically claims the event before the subscription mutation", () => {
  assert.match(sql, /insert into public\.drop_service_stripe_events[\s\S]*on conflict \(stripe_event_id\) do nothing/);
  assert.match(sql, /if not found then\s+return 'already_processed';/);
  assert.match(sql, /insert into public\.drop_service_subscriptions/);
  assert.match(sql, /return 'processed';/);
});

test("RPC preserves subscription uniqueness and canceled rows via upsert, never delete", () => {
  assert.match(sql, /on conflict \(artisan_id\) do update set/);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.drop_service_subscriptions/i);
  assert.match(sql, /'canceled'/);
  assert.match(sql, /stripe_subscription_id = excluded\.stripe_subscription_id/);
});

test("invalid status and interval are rejected before event registration", () => {
  const eventInsert = sql.indexOf("insert into public.drop_service_stripe_events");
  assert.ok(sql.indexOf("invalid subscription status") < eventInsert);
  assert.ok(sql.indexOf("invalid billing interval") < eventInsert);
  assert.match(sql, /p_billing_interval not in \('month', 'year'\)/);
});

test("browser roles cannot execute the SECURITY DEFINER RPC", () => {
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke all on function[\s\S]*from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function[\s\S]*to service_role;/);
});

test("failure after event claim rolls back because no exception is swallowed", () => {
  assert.doesNotMatch(sql, /exception\s+when/i);
  assert.doesNotMatch(sql, /commit|rollback/i);
});
