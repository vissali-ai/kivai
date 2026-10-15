import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const OWN = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

test("onboarding data is owned by the account and cannot be read by visitors", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table auth.users(id uuid primary key);
      insert into auth.users(id) values ('${OWN}'), ('${OTHER}');
    `);
    await db.exec(read("../../supabase/migrations/20261015163000_user_onboarding.sql"));
    await db.exec(`set request.jwt.claim.sub = '${OWN}'; set role authenticated;`);
    await db.exec(`insert into public.user_onboarding(user_id, goal, status) values ('${OWN}', 'images', 'completed');`);
    await assert.rejects(db.exec(`insert into public.user_onboarding(user_id, goal, status) values ('${OTHER}', 'social', 'completed');`), /row-level security/i);
    const ownRows = await db.query("select user_id, goal from public.user_onboarding");
    assert.equal(ownRows.rows.length, 1);
    assert.equal(ownRows.rows[0].goal, "images");
    await assert.rejects(db.exec("update public.user_onboarding set user_id = '" + OTHER + "'"), /row-level security/i);
    await db.exec("reset role;");
    await db.exec(`set role anon;`);
    await assert.rejects(db.exec("select * from public.user_onboarding"), /permission denied/i);
  } finally {
    await db.close();
  }
});

test("welcome uses existing result card and preserves download actions", () => {
  const result = read("../../components/tools/tool-result-card.tsx");
  assert.match(result, /<ToolActionBar className="mt-5">\{actions\}<\/ToolActionBar><PostResultWelcome\s*\/>/);
  assert.match(read("../../components/tools/post-result-welcome.tsx"), /getStoredSession\(\)/);
  assert.match(read("../../components/account/account-dashboard.tsx"), /<AccountWelcome userId=\{userId\}/);
});
