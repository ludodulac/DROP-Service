import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const admin = readFileSync("src/app/admin/page.tsx", "utf8");
const publicUrl = readFileSync("src/lib/public-app-url.ts", "utf8");
const adminLayout = readFileSync("src/app/admin/layout.tsx", "utf8");

test("artisan public share link is derived from the authenticated artisan slug without preview state", () => {
  assert.match(dashboard, /getArtisanPublicUrl\(artisan\.slug\)/);
  assert.match(publicUrl, /\/a\/\$\{encodeURIComponent\(slug\)\}/);
  assert.doesNotMatch(publicUrl, /joel-cheminees/i);
  const shareFunction = dashboard.slice(dashboard.indexOf("async function sharePublicPage"), dashboard.indexOf("async function updateStatus"));
  assert.doesNotMatch(shareFunction, /preview=1/);
});

test("dashboard provides copy feedback and native Web Share with copy fallback", () => {
  assert.match(dashboard, />Copier le lien<\/button>/);
  assert.match(dashboard, />Partager<\/button>/);
  assert.match(dashboard, /navigator\.clipboard\.writeText\(publicUrl\)/);
  assert.match(dashboard, /showShareFeedback\("Lien copié"\)/);
  assert.match(dashboard, /if \(!navigator\.share\) \{[\s\S]*?copyPublicPageLink\(\)/);
  assert.match(dashboard, /navigator\.share\(\{[\s\S]*?title: artisan\.company_name,[\s\S]*?text: "Vous pouvez m’envoyer votre demande ici :",[\s\S]*?url: publicUrl/);
});

test("preview remains distinct from the clean client share URL", () => {
  assert.match(dashboard, /href=\{\`\/a\/\$\{artisan\.slug\}\?preview=1\`\}>Prévisualiser ma page publique/);
  assert.match(publicUrl, /return getPublicAppUrl\(\`\/a\/\$\{encodeURIComponent\(slug\)\}\`\)/);
});

test("owner hamburger exposes useful links protected by the existing admin owner guard", () => {
  assert.match(admin, />\s*Liens utiles\s*<\/button>/);
  assert.match(admin, /Inscription artisan/);
  assert.match(admin, /Connexion artisan/);
  assert.match(admin, /Accueil BRIF/);
  assert.match(admin, /getPublicAppUrl\("\/signup"\)/);
  assert.match(admin, /getPublicAppUrl\("\/login"\)/);
  assert.match(admin, /getPublicAppUrl\("\/"\)/);
  assert.match(adminLayout, /destination !== "\/admin"/);
  assert.match(adminLayout, /resolveAuthDestination\(\)/);
});

test("useful owner links are not exposed as an artisan dashboard feature", () => {
  assert.doesNotMatch(dashboard, /Liens utiles|Inscription artisan|Connexion artisan/);
});

test("public origin has a canonical production fallback while remaining configurable", () => {
  assert.match(publicUrl, /process\.env\.NEXT_PUBLIC_APP_URL/);
  assert.match(publicUrl, /https:\/\/brif-artisans\.vercel\.app/);
});
