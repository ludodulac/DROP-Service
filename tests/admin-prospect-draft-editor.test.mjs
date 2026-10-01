import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const admin = readFileSync("src/app/admin/page.tsx", "utf8");

test("prospect drawer always exposes a draft editor, including an empty prospect such as AS 29", () => {
  assert.match(admin, /<h3>Préparer le message<\/h3>/);
  assert.match(admin, /Objet du message<input[^>]*required[^>]*value=\{draftSubject\}/);
  assert.match(admin, /Corps du message<textarea[^>]*required[^>]*value=\{draftEmail\}/);
  assert.match(admin, /useState\(prospect\.draft_subject \?\? ""\)/);
  assert.match(admin, /useState\(prospect\.draft_email \?\? ""\)/);
  assert.doesNotMatch(admin, /prospect\.draft_email && <div className="admin-drawer-section">\s*<div className="admin-email-head"><h3>Préparer le message/);
});

test("saving a draft persists existing draft_subject and draft_email columns and refreshes local state", () => {
  assert.match(admin, /async function saveDraft\(id: string, subject: string, message: string\)/);
  assert.match(admin, /\.from\("drop_service_admin_prospects"\)[\s\S]*?\.update\(\{[\s\S]*?draft_subject: draftSubject,[\s\S]*?draft_email: draftEmail,[\s\S]*?updated_at:/);
  assert.match(admin, /\.eq\("id", id\)[\s\S]*?\.select\("draft_subject, draft_email"\)[\s\S]*?\.single\(\)/);
  assert.match(admin, /draft_subject: updated\.draft_subject, draft_email: updated\.draft_email/);
});

test("reload path already reads persisted draft columns", () => {
  const selections = admin.match(/\.select\("id, company_name, contact_name, email, phone, website, city, activity, status, priority, why_fit, draft_subject, draft_email, next_action, next_action_at, notes, created_at"\)/g) ?? [];
  assert.ok(selections.length >= 2);
});

test("saved draft can open a prefilled email without sending automatically", () => {
  assert.match(admin, /function gmailComposeUrl\(prospect: Prospect\)/);
  assert.match(admin, /subject: prospect\.draft_subject \?\? ""/);
  assert.match(admin, /body: prospect\.draft_email/);
  assert.match(admin, /mailto:\$\{encodeURIComponent\(prospect\.email\)\}/);
  assert.match(admin, /Copier le message/);
  assert.match(admin, /Valider ce message/);
  assert.match(admin, /Ouvrir l’email préparé/);
  assert.match(admin, /Marquer comme envoyé/);
  assert.match(admin, /prospect\.draft_email && <div className="admin-drawer-section">/);
});

test("draft editor does not send email or add an automatic generator", () => {
  const saveStart = admin.indexOf("async function saveDraft");
  const saveEnd = admin.indexOf("async function createProspect", saveStart);
  const saveBlock = admin.slice(saveStart, saveEnd);
  assert.doesNotMatch(saveBlock, /fetch\(/);
  assert.doesNotMatch(saveBlock, /openai|anthropic|generateText|generateObject|chat\.completions/i);
  assert.doesNotMatch(saveBlock, /gmailComposeUrl|mail\.google|sendArtisanRequestNotification|resend/i);
  assert.match(admin, /Rien n’est envoyé automatiquement/);
});
