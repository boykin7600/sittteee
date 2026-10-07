import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("prelanding uses crisp inline arrow icons and links directly to the offer cards", () => {
  const page = read("public/prelanding/index.html");
  assert.doesNotMatch(page, /[↗→←↓]/);
  assert.match(page, /class="ui-arrow ui-arrow-right"/);
  assert.match(page, /class="ui-arrow ui-arrow-left"/);
  assert.match(page, /class="ui-arrow ui-arrow-up-right"/);
  assert.match(page, /https:\/\/inositol\.shop\/#order-options/g);
  assert.doesNotMatch(page, /https:\/\/inositol\.shop\/#order(?:["?])/);
});

test("main-site purchase anchor lands on the offer cards, not the section heading", () => {
  const page = read("public/index.html");
  const enhancement = read("public/assets/premium-redesign-v1.js");
  const styles = read("public/assets/premium-redesign-v2.css");
  assert.match(page, /<div class="offer-grid" id="order-options">/);
  assert.match(enhancement, /grid\.id = "order-options";/);
  assert.match(enhancement, /grid\.scrollIntoView\(\{ block: "start", behavior: "auto" \}\)/);
  assert.match(styles, /\.offer-grid\s*\{[^}]*scroll-margin-top:\s*24px/s);
});

test("result screen uses the supplied scenic background instead of repeating the product backdrop", () => {
  const page = read("public/prelanding/index.html");
  const css = read("public/prelanding/result-experience.css");
  assert.match(page, /preload[^>]+result-scenic-background\.jpg/);
  assert.match(css, /\.result-hero\s*\{[^}]*url\('\.\.\/assets\/result-scenic-background\.jpg'\)/s);
  assert.match(css, /background-image:[^;]*url\('\.\.\/assets\/result-scenic-background\.jpg'\)/s);
  assert.doesNotMatch(css, /\.result-hero\s*\{[^}]*url\('\.\.\/assets\/hero-bg-v2\.webp'\)/s);
});
