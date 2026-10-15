import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

test("manifest exposes standalone install metadata and correctly sized PNG icons", () => {
  const mod = { exports: {} };
  const compiled = ts.transpileModule(read("../../app/manifest.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("module", "exports", compiled)(mod, mod.exports);
  const manifest = mod.exports.default();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.deepEqual(manifest.icons.map((item) => item.sizes), ["192x192", "512x512"]);
});

test("service worker never intercepts file uploads, downloads or private API requests", () => {
  const sw = read("../../public/sw.js");
  assert.doesNotMatch(sw, /addEventListener\s*\(\s*['"]fetch['"]/);
  assert.doesNotMatch(sw, /caches\.open|cache\.put|cache\.add|showNotification/);
  assert.match(read("../../components/pwa/install-kivai-prompt.tsx"), /beforeinstallprompt/);
  assert.match(read("../../components/pwa/install-kivai-prompt.tsx"), /Adicionar à Tela de Início/);
});

test("installation offer is based on real tool use and has a dismiss interval", () => {
  const mod = { exports: {} };
  const compiled = ts.transpileModule(read("../../lib/pwa/install-eligibility.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("module", "exports", compiled)(mod, mod.exports);
  const values = new Map();
  const oldWindow = globalThis.window;
  const oldDateNow = Date.now;
  const now = 2_000_000_000_000;
  Date.now = () => now;
  globalThis.window = {
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  try {
    assert.equal(mod.exports.isEligibleForInstallOffer(), false);
    mod.exports.recordSuccessfulToolUse("unir-pdfs");
    assert.equal(mod.exports.isEligibleForInstallOffer(), false);
    mod.exports.recordSuccessfulToolUse("unir-pdfs");
    assert.equal(mod.exports.isEligibleForInstallOffer(), false);
    values.set("kivai_pwa_engagement_v1", JSON.stringify({ firstAt: now - 24 * 3600_000, lastAt: now - 3600_000, count: 1, lastSlug: "unir-pdfs" }));
    assert.equal(mod.exports.isEligibleForInstallOffer(), true);
    assert.equal(mod.exports.isEligibleForInstallOffer(now, "/ferramentas/unir-pdfs"), false);
    assert.equal(mod.exports.isEligibleForInstallOffer(now, "/conta"), true);
    mod.exports.deferInstallOffer(30);
    assert.equal(mod.exports.isEligibleForInstallOffer(), false);
  } finally {
    Date.now = oldDateNow;
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
  }
});
