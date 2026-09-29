import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/admin/page.tsx", "utf8");
const css = readFileSync("src/app/admin/admin.css", "utf8");

test("admin page is explicitly contained to the mobile viewport", () => {
  assert.match(css, /\.admin-page\s*\{[^}]*max-width:\s*100%[^}]*overflow-x:\s*clip/s);
  assert.match(css, /\.admin-content\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*overflow-x:\s*clip/s);
});

test("only the admin navigation remains a horizontal mobile scroller", () => {
  assert.match(css, /\.admin-nav\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.admin-sidebar\s*\{[^}]*overflow-x:\s*hidden/s);
});

test("wide desktop prospect table is replaced by mobile prospect cards", () => {
  assert.match(page, /className="admin-mobile-prospect-list"/);
  assert.match(page, /className="admin-mobile-prospect-card"/);
  assert.match(page, /className="table-wrap admin-desktop-prospect-table"/);
  assert.match(css, /\.admin-desktop-prospect-table\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.admin-mobile-prospect-list\s*\{[^}]*display:\s*grid/s);
});

test("long admin content can wrap instead of widening the page", () => {
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /word-break:\s*break-word/);
  assert.match(css, /\.admin-mobile-prospect-card \.compact-select\s*\{[^}]*max-width:\s*100%/s);
});

test("email badge and email results use the same business filter", () => {
  assert.match(page, /const emailMessages = prospects\.filter\([\s\S]*\["to_review", "approved"\]\.includes\(p\.status\) && Boolean\(p\.draft_email\)/);
  assert.match(page, /if \(activeTab === "emails"\) return \["to_review", "approved"\]\.includes\(p\.status\) && Boolean\(p\.draft_email\)/);
  assert.match(page, /label="Emails à valider" badge=\{\`\$\{counts\.emailMessages\} message/);
});

test("navigation badges expose their meaning instead of bare ambiguous numbers", () => {
  assert.match(page, /label="Aujourd'hui" badge=\{\`\$\{counts\.today\} action/);
  assert.match(page, /label="Prospects" badge=\{\`\$\{prospects\.length\} total\`\}/);
  assert.match(page, /label="Pilotes" badge=\{String\(counts\.pilots\)\}/);
  assert.match(page, /function AdminNav\(\{ active, onClick, label, badge \}/);
  assert.match(page, /<strong>\{badge\}<\/strong>/);
});

test("today badge includes every category represented on the Today view", () => {
  assert.match(page, /today:\s*review \+ ready \+ followup \+ tasks\.length/);
});
