import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("checkout fields do not trigger iOS focus zoom", () => {
  const css = read("public/assets/legal-safety-v1.css");
  assert.match(
    css,
    /\.order-sheet\s+:is\(input,\s*select,\s*textarea\)[^{]*\{[^}]*font-size:\s*16px\s*!important/s,
  );
});

test("consent text keeps a readable mobile column and cannot overlap delivery", () => {
  const css = read("public/assets/legal-safety-v1.css");
  assert.match(css, /\.order-sheet \.consent-row[^{]*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.order-sheet \.consent-row\s*>\s*button[^{]*\{[^}]*flex:\s*0\s+0\s+auto/s);
  assert.match(css, /\.order-sheet \.consent-row\s*>\s*span[^{]*\{[^}]*min-width:\s*0[^}]*flex:\s*1\s+1\s+auto/s);
  assert.match(css, /\.order-sheet \.delivery-note\s*\{[^}]*clear:\s*both/s);
});

test("legal copy updates the label text instead of the checkbox icon", () => {
  const js = read("public/assets/legal-safety-v1.js");
  assert.match(js, /sheet\.querySelector\("\.consent-row > span"\)/);
  assert.match(js, /querySelectorAll\("\.chat-intro \.consent-row > span"\)/);
  assert.doesNotMatch(js, /querySelector\("\.consent-row span"\)/);
});
