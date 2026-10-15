import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("first mission mapping only chooses verified supported tools", () => {
  const source = ts.transpileModule(read("../../lib/account/first-mission.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", source)(module, module.exports);
  const fn = module.exports.getFirstMission;
  assert.equal(fn("images").slug, "compressor-de-imagens");
  assert.equal(fn("documents").slug, "unir-pdfs");
  assert.equal(fn("sales").slug, "calculadora-de-markup");
  assert.equal(fn("social").slug, "planejador-de-conteudo-social-media");
  assert.equal(fn(null).slug, "compressor-de-imagens");
});

test("migration extends account onboarding and keeps existing records", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table auth.users(id uuid primary key);
      insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111');
    `);
    await db.exec(read("../../supabase/migrations/20261015163000_user_onboarding.sql"));
    await db.exec(`insert into public.user_onboarding(user_id, goal, status) values
      ('11111111-1111-4111-8111-111111111111','images','completed');`);
    await db.exec(read("../../supabase/migrations/20261015173500_first_mission_progress.sql"));
    const old = await db.query("select goal, first_mission_completed_at from public.user_onboarding");
    assert.equal(old.rows[0].goal, "images");
    assert.equal(old.rows[0].first_mission_completed_at, null);
    await db.exec(`set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; set role authenticated;`);
    await db.exec(`update public.user_onboarding set first_mission_tool_slug='compressor-de-imagens', first_mission_completed_at=now();`);
    const result = await db.query("select first_mission_tool_slug from public.user_onboarding");
    assert.equal(result.rows[0].first_mission_tool_slug, "compressor-de-imagens");
    await assert.rejects(db.exec("update public.user_onboarding set first_mission_completed_at=null"), /check constraint/);
  } finally { await db.close(); }
});

test("completion only exists after a rendered result and validates the selected mission", () => {
  const marker = read("../../components/tools/first-mission-result.tsx");
  const result = read("../../components/tools/tool-result-card.tsx");
  const markup = read("../../app/ferramentas/calculadora-de-markup/calculadora-de-markup-client.tsx");
  const planner = read("../../app/ferramentas/planejador-de-conteudo-social-media/planejador-client.tsx");
  assert.match(marker, /getFirstMission\(progress.goal\).slug !== slug/);
  assert.match(marker, /missao/);
  assert.match(result, /<FirstMissionResult\s*\/>/);
  assert.match(markup, /resultado && custoTotal.trim\(\) && markup.trim\(\)/);
  assert.match(planner, /missionGenerated && generated/);
});
