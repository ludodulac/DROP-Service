import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signup = readFileSync("src/app/signup/page.tsx", "utf8");
const login = readFileSync("src/app/login/page.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

const benefitStart = signup.indexOf('<ul className="auth-benefits"');
const benefitEnd = signup.indexOf("</ul>", benefitStart);
const benefitMarkup = signup.slice(benefitStart, benefitEnd + 5);

test("signup uses the exact three editorial BRIF benefits", () => {
  for (const text of [
    "Prêt en quelques minutes",
    "Créez votre espace sans configuration compliquée.",
    "Simple, sans jargon",
    "Tout est conçu pour être compris immédiatement.",
    "Pensé pour le terrain",
    "Une utilisation simple, même depuis votre téléphone.",
  ]) {
    assert.match(benefitMarkup, new RegExp(text.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }
});

test("benefit zone is editorial and has no interactive semantics", () => {
  assert.ok(benefitStart >= 0 && benefitEnd > benefitStart);
  assert.match(benefitMarkup, /<ul className="auth-benefits" aria-label="Avantages de BRIF">/);
  assert.match(benefitMarkup, /<li className="auth-benefit">/);
  assert.doesNotMatch(benefitMarkup, /<button|<a\b|href=|onClick=|role=["']button["']|tabIndex=|cursor:/i);
  assert.doesNotMatch(css, /\.auth-benefit(?:s|[-\w\s>]*)?:hover/);
  assert.doesNotMatch(css, /\.auth-benefit[^\{]*\{[^}]*cursor\s*:\s*pointer/i);
});

test("benefits are vertical, content-like and visually subordinate to real CTA buttons", () => {
  assert.match(css, /\.auth-benefits \{[^}]*display:\s*grid;[^}]*gap:\s*0;/s);
  assert.match(css, /\.auth-benefit \{[^}]*grid-template-columns:\s*36px minmax\(0, 1fr\);/s);
  assert.match(css, /\.auth-benefit \+ \.auth-benefit \{[^}]*border-top:\s*1px solid #e4e7ec;/s);
  assert.match(css, /\.auth-benefit-icon \{[^}]*background:\s*#eff6ff;[^}]*color:\s*#1d4ed8;/s);
  assert.match(css, /\.auth-benefit-copy strong \{[^}]*color:\s*#182230;/s);
  assert.match(css, /\.auth-benefit-copy > span \{[^}]*color:\s*#475467;/s);
  assert.match(css, /\.button \{[^}]*background:\s*var\(--brand\);[^}]*cursor:\s*pointer;/s);
  assert.doesNotMatch(css, /\.auth-benefit[^\{]*\{[^}]*box-shadow/i);
  assert.doesNotMatch(css, /\.auth-benefit[^\{]*\{[^}]*border-radius/i);
});

test("320px mobile safety keeps copy shrinkable and wrapping without fixed card widths", () => {
  assert.match(css, /\.auth-benefits \{[^}]*width:\s*100%;[^}]*max-width:\s*540px;/s);
  assert.match(css, /\.auth-benefit \{[^}]*min-width:\s*0;[^}]*grid-template-columns:\s*36px minmax\(0, 1fr\);/s);
  assert.match(css, /\.auth-benefit-copy \{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.auth-benefit-copy > span \{[^}]*overflow-wrap:\s*anywhere;/s);
  assert.doesNotMatch(css, /\.auth-benefit(?:s)?[^\{]*\{[^}]*(?:min-width:\s*[4-9]\d\dpx|width:\s*[4-9]\d\dpx)/i);
});

test("login benefits remain untouched because they are a different existing content set", () => {
  for (const text of ["Demandes centralisées", "Priorités visibles", "Suivi simple"]) assert.match(login, new RegExp(text));
  assert.doesNotMatch(login, /Prêt en quelques minutes|Créez votre espace sans configuration compliquée/);
});
