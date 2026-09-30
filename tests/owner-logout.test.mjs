import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminPage = readFileSync("src/app/admin/page.tsx", "utf8");
const adminCss = readFileSync("src/app/admin/admin.css", "utf8");
const adminLayout = readFileSync("src/app/admin/layout.tsx", "utf8");
const dashboardPage = readFileSync("src/app/dashboard/page.tsx", "utf8");

test("owner navigation exposes a touchable hamburger beside the Administration identity", () => {
  assert.match(adminPage, /className="admin-brand-row"/);
  assert.match(adminPage, /<strong>Administration<\/strong><span>Ludovic Dulac<\/span>/);
  assert.match(adminPage, /className="admin-owner-menu-trigger"/);
  assert.match(adminPage, /aria-expanded=\{ownerMenuOpen\}/);
  assert.match(adminPage, /aria-controls="owner-menu"/);
  assert.match(adminCss, /\.admin-owner-menu-trigger\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
});

test("owner menu opens and can be explicitly closed", () => {
  assert.match(adminPage, /ownerMenuOpen &&/);
  assert.match(adminPage, /id="owner-menu" role="menu"/);
  assert.match(adminPage, /Menu propriétaire/);
  assert.match(adminPage, /aria-label="Fermer le menu propriétaire"/);
  assert.match(adminPage, /setOwnerMenuOpen\(false\)/);
});

test("owner menu contains only the owner-relevant logout action", () => {
  assert.match(adminPage, /className="admin-owner-menu-item"[^>]*>\s*Se déconnecter/s);
  assert.doesNotMatch(adminPage, /Voir l'espace artisan/);
});

test("owner logout clears the current Supabase session before hard redirecting to owner login", () => {
  const signOutIndex = adminPage.indexOf('await supabase.auth.signOut({ scope: "local" })');
  const redirectIndex = adminPage.indexOf('window.location.replace("/owner/login")');
  assert.ok(signOutIndex >= 0);
  assert.ok(redirectIndex > signOutIndex);
});

test("owner menu is constrained to the viewport and cannot create page overflow", () => {
  assert.match(adminCss, /\.admin-owner-menu\s*\{[^}]*right:\s*0[^}]*width:\s*min\(280px, calc\(100vw - 36px\)\)[^}]*max-width:\s*calc\(100vw - 36px\)[^}]*overflow:\s*hidden/s);
  assert.match(adminCss, /\.admin-page\s*\{[^}]*overflow-x:\s*clip/s);
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
