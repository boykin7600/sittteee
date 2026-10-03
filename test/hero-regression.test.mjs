import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "public/index.html"), "utf8");
const enhancer = readFileSync(join(root, "public/assets/mobile-layout-v4.js"), "utf8");
const premiumCss = readFileSync(join(root, "public/assets/premium-redesign-v2.css"), "utf8");

test("the compatible server shell cannot visibly flash the legacy headline", () => {
  assert.match(html, /<h1>Производим<br\/>после вашего/i);
  assert.match(premiumCss, /content:\s*"Инозитол"/);
  assert.match(premiumCss, /content:\s*"KONONOV\."/);
  assert.match(premiumCss, /\.hero-copy\s*>\s*h1\s*\{[^}]*font-size:\s*0/is);
  assert.match(enhancer, /Инозитол<br><em>KONONOV\.<\/em>/);
});

test("static and hydrated bottle fallbacks use the optimized image", () => {
  assert.match(html, /bottle-fallback[^>]+bottle-front\.webp/);
  assert.doesNotMatch(html, /bottle-front\.png/);
});

test("desktop hero copy uses a compact vertical rhythm without changing the mobile split", () => {
  assert.match(premiumCss, /@media\s*\(min-width:\s*1101px\)/);
  assert.match(
    premiumCss,
    /@media\s*\(min-width:\s*1101px\)[\s\S]*?\.hero-copy\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*justify-content:\s*center/is,
  );
  assert.match(premiumCss, /\.hero-copy\s*>\s*\.eyebrow\s*\{[^}]*margin-bottom:\s*1\.1rem/is);
  assert.match(premiumCss, /\.hero-rating-link\s*\{[^}]*margin:\s*\.8rem\s+0\s+0/is);
  assert.match(premiumCss, /\.hero-copy\s*>\s*\.hero-lead\s*\{[^}]*margin-top:\s*1\.35rem/is);
  assert.match(premiumCss, /\.hero-facts\s*\{[^}]*margin-top:\s*1\.15rem/is);
  assert.match(premiumCss, /\.hero-actions\s*\{[^}]*margin-top:\s*1\.35rem/is);
  assert.match(premiumCss, /\.hero-price\s*\{[^}]*margin-top:\s*1\.15rem/is);
});
