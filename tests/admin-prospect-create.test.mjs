import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const admin = readFileSync("src/app/admin/page.tsx", "utf8");
const adminRls = readFileSync("supabase/restrict_admin_to_ludovic.sql", "utf8");

test("admin exposes a simple New prospect creation flow", () => {
  assert.match(admin, />Nouveau prospect<\/button>/);
  assert.match(admin, /<h2>Nouveau prospect<\/h2>/);
  assert.match(admin, /onSubmit=\{createProspect\}/);
  for (const field of ["company", "contact", "email", "phone", "website", "city", "activity", "why"]) {
    assert.match(admin, new RegExp(`name="${field}"`));
  }
});

test("new prospect is persisted in drop_service_admin_prospects then reloaded", () => {
  const createStart = admin.indexOf("async function createProspect");
  const createEnd = admin.indexOf("const selected =", createStart);
  const createBlock = admin.slice(createStart, createEnd);
  assert.match(createBlock, /\.from\("drop_service_admin_prospects"\)\.insert\(/);
  assert.match(createBlock, /company_name:/);
  assert.match(createBlock, /contact_name:/);
  assert.match(createBlock, /email:/);
  assert.match(createBlock, /phone:/);
  assert.match(createBlock, /website:/);
  assert.match(createBlock, /city:/);
  assert.match(createBlock, /activity:/);
  assert.match(createBlock, /why_fit:/);
  assert.match(createBlock, /status: "to_review"/);
  assert.match(createBlock, /priority: "normal"/);
  assert.match(createBlock, /await loadAdmin\(\)/);
  assert.match(createBlock, /setActiveTab\("prospects"\)/);
});

test("owner id comes only from the authenticated user and cannot be chosen in the form", () => {
  const createStart = admin.indexOf("async function createProspect");
  const createEnd = admin.indexOf("const selected =", createStart);
  const createBlock = admin.slice(createStart, createEnd);
  assert.match(createBlock, /supabase\.auth\.getUser\(\)/);
  assert.match(createBlock, /owner_id: userData\.user\.id/);
  assert.doesNotMatch(admin, /name="owner(?:_id)?"/);
  assert.doesNotMatch(createBlock, /form\.get\("owner/);
});

test("admin list remains scoped to the authenticated owner", () => {
  const loadStart = admin.indexOf("async function loadAdmin");
  const loadEnd = admin.indexOf("async function ensureFollowupTask", loadStart);
  const loadBlock = admin.slice(loadStart, loadEnd);
  assert.match(loadBlock, /supabase\.auth\.getUser\(\)/);
  assert.match(loadBlock, /\.eq\("owner_id", user\.id\)/);
});

test("existing Ludovic-only RLS remains the defense in depth", () => {
  assert.match(adminRls, /for insert to authenticated/);
  assert.match(adminRls, /\(select auth\.uid\(\)\) = owner_id/);
  assert.match(adminRls, /auth\.jwt\(\) ->> 'email'/);
  assert.match(adminRls, /ludodulac@gmail\.com/);
});

test("historical seeded prospects are retained for later migration", () => {
  assert.match(admin, /const initialProspects = \[/);
  assert.match(admin, /company_name: "Emmanuel Lambal"/);
  assert.match(admin, /company_name: "Entreprise KERMAS"/);
  assert.match(admin, /company_name: "EDPC - Plomberie Chauffage Brest"/);
});
