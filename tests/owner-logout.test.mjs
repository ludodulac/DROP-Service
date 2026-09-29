import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminPage = readFileSync("src/app/admin/page.tsx", "utf8");
const adminCss = readFileSync("src/app/admin/admin.css", "utf8");
const adminLayout = readFileSync("src/app/admin/layout.tsx", "utf8");
const dashboardPage = readFileSync("src/app/dashboard/page.tsx", "utf8");

test("owner logout is visible beside the Administration identity", () => {
  assert.match(adminPage, /className="admin-brand-row"/);
  assert.match(adminPage, /<strong>Administration<\/strong><span>Ludovic Dulac<\/span>/);
  assert.match(adminPage, />Se déconnecter<\/button>/);
  assert.match(adminCss, /\.admin-owner-logout/);
});

test("owner logout clears Supabase Auth before hard redirecting to owner login", () => {
  const signOutIndex = adminPage.indexOf("await supabase.auth.signOut()");
  const redirectIndex = adminPage.indexOf('window.location.replace("/owner/login")');
  assert.ok(signOutIndex >= 0);
  assert.ok(redirectIndex > signOutIndex);
});

test("owner logout reports signout failure instead of redirecting blindly", () => {
  assert.match(adminPage, /if \(signOutError\)/);
  assert.match(adminPage, /La déconnexion n’a pas pu être effectuée/);
});

test("admin remains protected by the existing server role guard after logout", () => {
  assert.match(adminLayout, /resolveAuthDestination\(\)/);
  assert.match(adminLayout, /destination !== "\/admin"/);
  assert.match(adminLayout, /redirect\(destination\)/);
});

test("artisan logout implementation is unchanged in purpose and destination", () => {
  assert.match(dashboardPage, /async function signOut\(\)/);
  assert.match(dashboardPage, /await supabase\.auth\.signOut\(\)/);
  assert.match(dashboardPage, /router\.replace\("\/login"\)/);
});
