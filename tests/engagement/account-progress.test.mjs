import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

test("progress counts existing favorites and daily completed tool results, with account isolation", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table auth.users(id uuid primary key);
      insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');
      create table public.user_tool_favorites (user_id uuid not null, tool_slug text not null);
      alter table public.user_tool_favorites enable row level security;
      grant select on public.user_tool_favorites to authenticated;
      create policy favorites_owner on public.user_tool_favorites
        for select to authenticated using (auth.uid() = user_id);
      insert into public.user_tool_favorites(user_id, tool_slug)
        values ('${USER_A}','unir-pdfs'),('${USER_A}','compressor-de-imagens'),('${USER_B}','gerador-de-qr-code');
    `);
    await db.exec(read("../../supabase/migrations/20261015203000_user_tool_completion_progress.sql"));
    await db.exec(`set request.jwt.claim.sub = '${USER_A}'; set role authenticated;`);
    await db.exec("select public.record_kivai_tool_completion('unir-pdfs');");
    await db.exec("select public.record_kivai_tool_completion('unir-pdfs');");
    await db.exec("select public.record_kivai_tool_completion('compressor-de-imagens');");
    const own = await db.query("select * from public.get_kivai_progress()");
    assert.equal(own.rows[0].favorite_count, 2);
    assert.equal(own.rows[0].result_count, 2);
    assert.equal(own.rows[0].different_tools, 2);
    assert.equal(own.rows[0].active_days, 1);
    await assert.rejects(
      db.exec("insert into public.user_tool_completion_days (user_id,tool_slug,completed_on) values ('" + USER_A + "','unir-pdfs',current_date)"),
      /permission denied/i,
    );
    await assert.rejects(
      db.exec("select public.record_kivai_tool_completion('NOT ALLOWED')"),
      /Invalid tool/i,
    );
    await db.exec("reset role;");
    await db.exec(`set request.jwt.claim.sub = '${USER_B}'; set role authenticated;`);
    const other = await db.query("select * from public.get_kivai_progress()");
    assert.equal(other.rows[0].favorite_count, 1);
    assert.equal(other.rows[0].result_count, 0);
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.exec("select * from public.get_kivai_progress()"), /permission denied/i);
  } finally {
    await db.close();
  }
});

test("achievement UI reuses previous mission and favorites, without payment changes", () => {
  const ui = read("../../components/account/account-progress.tsx");
  const myKivai = read("../../components/account/account-welcome.tsx");
  const result = read("../../components/tools/first-mission-result.tsx");
  assert.match(ui, /get_kivai_progress/);
  assert.match(ui, /kivai-favorites-changed/);
  assert.match(ui, /Resultados anteriores a esta etapa não são contabilizados/);
  assert.match(myKivai, /AccountProgress userId=\{userId\} firstMissionDone=\{Boolean\(missionCompletedAt\)\}/);
  assert.match(result, /rpc\/record_kivai_tool_completion/);
  assert.match(result, /getFirstMission\(progress.goal\).slug !== slug/);
});
