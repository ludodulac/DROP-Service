import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signup = readFileSync("src/app/signup/page.tsx", "utf8");

test("signup success without session uses the neutral Supabase-compatible message", () => {
  assert.match(
    signup,
    /Si cette adresse peut être utilisée pour une nouvelle inscription, vous recevrez un email de confirmation\. Vérifiez votre boîte de réception et vos courriers indésirables\. Si vous avez déjà un compte, vous pouvez vous connecter\./
  );
  assert.doesNotMatch(
    signup,
    /Compte créé\. Vérifiez votre boîte email pour confirmer votre inscription/
  );
});

test("signup does not try to detect whether the email already exists", () => {
  const start = signup.indexOf("async function handleSubmit");
  const end = signup.indexOf("return (", start);
  const submitFlow = signup.slice(start, end);

  assert.match(submitFlow, /supabase\.auth\.signUp\(\{ email, password \}\)/);
  assert.match(submitFlow, /if \(signUpError\)/);
  assert.match(submitFlow, /if \(data\.session\)/);
  assert.doesNotMatch(submitFlow, /getUser|admin|listUsers|existing|already registered|email_exists|user_exists/i);
});

test("existing login link remains available after the neutral message", () => {
  assert.match(signup, /href="\/login">Me connecter<\/Link>/);
});
