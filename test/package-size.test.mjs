import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(root, "public");

const obsoleteFiles = [
  "public/assets/backend-bridge.js",
  "public/assets/backend-bridge-v2.js",
  "public/assets/backend-bridge-v3.js",
  "public/assets/formula-game-v2.css",
  "public/assets/formula-game-v2.js",
  "public/assets/mobile-layout-v2.js",
  "public/assets/reviews-carousel-v2.css",
  "public/assets/reviews-carousel-v2.js",
  "public/assets/review-viktoria.png",
  "public/assets/label-project.jpg",
  "public/assets/quality-marks.jpg",
  ...Array.from({ length: 9 }, (_, index) => `public/assets/mobile-fixes-v${index + 2}.css`),
  "public/_next/static/chunks/app-route-prefetch-policy-CYLrbu4v.js",
  "public/_next/static/chunks/index-Bx69Ngp5.js",
  "public/_next/static/chunks/index-clean-v13.js",
  "public/_next/static/chunks/index-clean-v15.js",
  "public/_next/static/chunks/layout-segment-context-DOe4547n.js",
  "public/_next/static/chunks/site-experience-DG1ORU6A.js",
  "public/_next/static/chunks/site-experience-clean-v8.js",
  "public/_next/static/chunks/site-experience-clean-v9.js",
  "public/_next/static/chunks/site-experience-map-v5.js",
  "public/_next/static/chunks/site-experience-map-v6.js",
  "public/_next/static/chunks/site-experience-ritual-v7.js",
];

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

test("upload package excludes superseded frontend copies", () => {
  const remaining = obsoleteFiles.filter((file) => existsSync(join(root, file)));
  assert.deepEqual(remaining, []);
});

test("every individual GitHub upload file stays below 25 MiB", () => {
  const oversized = filesUnder(root)
    .filter((file) => !file.includes("node_modules"))
    .filter((file) => statSync(file).size >= 25 * 1024 * 1024);
  assert.deepEqual(oversized, []);
});

test("live page still points at the latest frontend and backend files", () => {
  const html = readFileSync(join(publicRoot, "index.html"), "utf8");
  const required = [
    "/_next/static/chunks/index-clean-v17.js",
    "/_next/static/chunks/site-experience-clean-v10.js",
    "/assets/backend-bridge-v4.js",
    "/assets/mobile-fixes-v11.css",
    "/assets/mobile-layout-v4.js",
    "/assets/premium-redesign-v2.css",
    "/assets/reviews-carousel-v3.js",
    "/assets/formula-game-v3.js",
  ];
  for (const reference of required) {
    assert.ok(html.includes(reference), `${reference} must be referenced`);
    assert.equal(existsSync(join(publicRoot, reference.split("?")[0])), true, `${reference} must exist`);
  }
});

test("Vinext dependency graph points only at the stable 3D bundle", () => {
  const indexChunk = readFileSync(join(publicRoot, "_next/static/chunks/index-clean-v17.js"), "utf8");
  const layoutChunk = readFileSync(join(publicRoot, "_next/static/chunks/layout-segment-context-clean-v17.js"), "utf8");

  assert.match(indexChunk, /site-experience-clean-v10\.js/);
  assert.doesNotMatch(indexChunk, /site-experience-stable-v18\.js/);
  assert.match(layoutChunk, /index-clean-v17\.js/);
  assert.doesNotMatch(layoutChunk, /index-clean-v23\.js/);
});

test("legacy review photos stay compressed for repository uploads", () => {
  assert.equal(existsSync(join(publicRoot, "assets/review-love.webp")), true);
  assert.equal(existsSync(join(publicRoot, "assets/review-love.png")), false);
  assert.ok(statSync(join(publicRoot, "assets/review-love.webp")).size < 500 * 1024);
});
