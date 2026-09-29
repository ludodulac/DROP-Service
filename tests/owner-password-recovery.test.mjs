import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ownerLogin = readFileSync("src/app/owner/login/page.tsx", "utf8");
const forgot = readFileSync("src/app/owner/forgot-password/page.tsx", "utf8");
const update = readFileSync("src/app/owner/update-password/page.tsx", "utf8");
const artisanForgot = readFileSync("src/app/forgot-password/page.tsx", "utf8");
const artisanUpdate = readFileSync("src/app/update-password/page.tsx", "utf8");

test("owner login exposes a dedicated forgotten-password link without artisan signup", () => {
  assert.match(ownerLogin, /href="\/owner\/forgot-password"/);
  assert.match(ownerLogin, />Mot de passe oublié \?</);
  assert.doesNotMatch(ownerLogin, /Créer mon espace artisan/);
});

test("owner recovery request uses Supabase resetPasswordForEmail and current origin", () => {
  assert.match(forgot, /supabase\.auth\.resetPasswordForEmail\(email, \{ redirectTo \}\)/);
  assert.match(forgot, /window\.location\.origin/);
  assert.match(forgot, /\/owner\/update-password/);
});

test("owner recovery request does not reveal whether an account exists", () => {
  assert.match(forgot, /Si cette adresse correspond à un compte/);
  assert.doesNotMatch(forgot, /compte existe[^\n]*YES|adresse existe|utilisateur existe/i);
});

test("owner new-password page is gated by PASSWORD_RECOVERY rather than any ordinary session", () => {
  assert.match(update, /event === "PASSWORD_RECOVERY"/);
  assert.doesNotMatch(update, /getSession\(\)/);
  assert.match(update, /setCanReset\(true\)/);
  assert.match(update, /setCanReset\(false\)/);
});

test("owner password update uses updateUser and confirms the new password", () => {
  assert.match(update, /supabase\.auth\.updateUser\(\{ password \}\)/);
  assert.match(update, /password !== passwordConfirm/);
  assert.match(update, /Confirmer le nouveau mot de passe/);
});

test("successful owner reset closes the recovery session and returns to owner login", () => {
  const updateIndex = update.indexOf("await supabase.auth.updateUser({ password })");
  const signOutIndex = update.indexOf('await supabase.auth.signOut({ scope: "local" })');
  const redirectIndex = update.indexOf('window.location.replace("/owner/login")');
  assert.ok(updateIndex >= 0);
  assert.ok(signOutIndex > updateIndex);
  assert.ok(redirectIndex > signOutIndex);
});

test("existing artisan password recovery files are not converted into owner routes", () => {
  assert.match(artisanForgot, /href="\/login"/);
  assert.match(artisanUpdate, /router\.replace\("\/dashboard"\)/);
  assert.doesNotMatch(artisanForgot, /owner\/forgot-password/);
  assert.doesNotMatch(artisanUpdate, /owner\/login/);
});
