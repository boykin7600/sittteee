import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("manufacturing notice is removed from the visible journey", () => {
  const css = read("public/assets/premium-redesign-v2.css");
  assert.match(css, /\.journey-note\s*\{[^}]*display:\s*none\s*!important/s);
});

test("legal warning is compact in the footer instead of a large standalone banner", () => {
  const legal = read("public/assets/legal-safety-v1.js");
  assert.doesNotMatch(legal, /addWarning\(\);/);
  assert.match(legal, /БАД\. Не является лекарственным средством/);
  assert.match(legal, /Перед применением рекомендуется проконсультироваться с врачом/);
});

test("formula backdrop only becomes visible after its image has loaded", () => {
  const js = read("public/assets/formula-game-v3.js");
  const css = read("public/assets/formula-game-v3.css");
  assert.match(js, /atelier-bg/);
  assert.match(js, /is-ready/);
  assert.match(css, /\.atelier-bg\.is-ready/);
  assert.match(css, /\.formula-scene\s*\{[^}]*radial-gradient/s);
});

test("mobile formula ingredients form a compact balanced ring", () => {
  const css = read("public/assets/mobile-fixes-v11.css");
  assert.match(css, /html\.mobile-ui \.formula-scene\s*\{[^}]*isolation:\s*isolate/s);
  assert.match(css, /html\.mobile-ui \.formula-scene \.atelier-bg\.is-ready\s*\{[^}]*opacity:\s*\.34/s);
  assert.match(css, /html\.mobile-ui \.orbit-1\s*\{[^}]*right:\s*14%/s);
  assert.match(css, /html\.mobile-ui \.orbit-2\s*\{[^}]*right:\s*22%/s);
  assert.match(css, /html\.mobile-ui \.orbit-3\s*\{[^}]*left:\s*22%/s);
  assert.match(css, /html\.mobile-ui \.orbit-4\s*\{[^}]*left:\s*14%/s);
});

test("Irina review keeps her face inside the landscape crop", () => {
  const css = read("public/assets/reviews-carousel-v3.css");
  assert.match(
    css,
    /\.review-rail \.review-card:first-child \.review-photo > img\s*\{[^}]*object-position:\s*center\s+20%/s,
  );
});

test("product passport is compact, expandable and omits the redundant intro", () => {
  const js = read("public/assets/legal-safety-v1.js");
  assert.doesNotMatch(
    js,
    /Основные сведения перенесены с потребительской этикетки\. Полная маркировка доступна на сайте до оформления заказа\./,
  );
  assert.match(js, /<details class="passport-disclosure">/);
  assert.match(js, /<summary>[\s\S]*Раскрыть паспорт продукта[\s\S]*<\/summary>/);
});

test("collapsed product passport does not leave a large empty mobile gap", () => {
  const css = read("public/assets/legal-safety-v1.css");
  assert.match(
    css,
    /\.legal-passport:has\(\.passport-disclosure:not\(\[open\]\)\)\s*\{[^}]*padding-bottom:\s*clamp\([^}]*!important/s,
  );
  assert.match(
    css,
    /\.legal-passport:has\(\.passport-disclosure:not\(\[open\]\)\)\s*\+\s*\.faq\s*\{[^}]*padding-top:\s*clamp\([^}]*!important/s,
  );
});
