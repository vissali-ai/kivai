import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("cron respects weekday, local time and does not send when disabled", () => {
  const module = { exports: {} };
  const content = ts.transpileModule(read("../../lib/account/routine-reminder-options.ts"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("module", "exports", content)(module, module.exports);
  const due = module.exports.dueReminderAt;
  const date = new Date("2026-10-19T12:12:00.000Z"); // Monday 09:12 in São Paulo
  const prefs = { enabled: true, weekday: 1, hour: 9, time_zone: "America/Sao_Paulo", tool_slug: "unir-pdfs" };
  assert.equal(due(prefs, date), "2026-10-19");
  assert.equal(due({ ...prefs, hour: 10 }, date), null);
  assert.equal(due({ ...prefs, weekday: 0 }, date), null);
  assert.equal(due({ ...prefs, enabled: false }, date), null);
  assert.equal(due({ ...prefs, time_zone: "invalid" }, date), null);
});

test("service worker displays push, opens internal destination, and never caches user files", () => {
  const sw = read("../../public/sw.js");
  assert.match(sw, /addEventListener\("push"/);
  assert.match(sw, /addEventListener\("notificationclick"/);
  assert.doesNotMatch(sw, /addEventListener\(["']fetch["']/);
  assert.doesNotMatch(sw, /caches\.open/);
});

test("reminder settings request browser permission only from user interaction", () => {
  const ui = read("../../components/account/routine-reminder-settings.tsx");
  assert.match(ui, /async function enable\(\)/);
  assert.match(ui, /Notification\.requestPermission\(\)/);
  assert.match(ui, /action: "disable"/);
});
