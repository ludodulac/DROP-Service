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

test("owner recovery request derives redirectTo from the current browser origin", () => {
  assert.match(forgot, /const redirectTo = new URL\("\/owner\/update-password", window\.location\.origin\)\.toString\(\);/);
  assert.match(forgot, /supabase\.auth\.resetPasswordForEmail\(email, \{ redirectTo \}\)/);
  assert.doesNotMatch(forgot, /https:\/\/[^"']*vercel\.app\/owner\/update-password/);
  assert.doesNotMatch(forgot, /drop-service-swart/i);
});

test("owner recovery redirect stays on the production origin", () => {
  const redirectTo = new URL("/owner/update-password", "https://brif-artisans.vercel.app").toString();
  assert.equal(redirectTo, "https://brif-artisans.vercel.app/owner/update-password");
});

test("owner recovery redirect stays on an arbitrary preview origin", () => {
  const previewOrigin = "https://brif-artisans-example-preview-ludo24.vercel.app";
  const redirectTo = new URL("/owner/update-password", previewOrigin).toString();
  assert.equal(redirectTo, `${previewOrigin}/owner/update-password`);
  assert.doesNotMatch(forgot, /brif-artisans-example-preview-ludo24/);
});

test("owner normal login remains password-based and role-routed", () => {
  assert.match(ownerLogin, /supabase\.auth\.signInWithPassword\(\{ email, password \}\)/);
  assert.match(ownerLogin, /fetch\("\/api\/auth\/destination", \{ cache: "no-store" \}\)/);
  assert.match(ownerLogin, /router\.replace\(destination\)/);
});

test("owner recovery request explains Supabase email rate limiting without changing other errors", () => {
  assert.match(forgot, /resetError\.code === "over_email_send_rate_limit"/);
  assert.match(forgot, /Un lien vient peut-être déjà d’être envoyé\. Patientez environ une minute avant d’en demander un nouveau\./);
  assert.match(forgot, /La demande n’a pas pu être envoyée pour le moment\. Réessayez dans quelques instants\./);
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
