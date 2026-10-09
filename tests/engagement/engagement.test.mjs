import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
function announcements(plan, rest) {
  const module = { exports: {} };
  const mocks = {
    'server-only': {},
    '@/lib/billing/access': { getAccountAccess: async () => ({ plan }) },
    '@/lib/blog/supabase': { supabaseRest: rest },
  };
  const source = ts.transpileModule(read('../../lib/account/announcements.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => {
    assert.ok(name in mocks, name); return mocks[name];
  }, module, module.exports);
  return module.exports;
}

test('announcement query filters audience and schedule before limiting, and reads only displayed IDs', async () => {
  for (const plan of ['free', 'pro', 'agency']) {
    const id = crypto.randomUUID();
    let calls = 0;
    const api = announcements(plan, async path => {
      const [table, search] = path.split('?');
      const query = new URLSearchParams(search);
      calls++;
      if (table === 'account_announcements') {
        assert.equal(query.get('audience'), `in.(all,${plan})`);
        assert.equal(query.get('enabled'), 'eq.true');
        assert.match(query.get('and'), /^\(or\(start_at.is.null,start_at.lte\..+\),or\(end_at.is.null,end_at.gt\..+\)\)$/);
        assert.equal(query.get('limit'), '150');
        return [{ id, title: 'Aviso', audience: plan }];
      }
      assert.equal(query.get('user_id'), 'eq.user-1');
      assert.equal(query.get('announcement_id'), `in.(${id})`);
      return [{ announcement_id: id }];
    });
    const notices = await api.listUserAnnouncements('user-1');
    assert.equal(notices[0].read, true);
    assert.equal(calls, 2);
  }
});

test('invalid announcement links and date windows never reach database', async () => {
  const api = announcements('free', async () => assert.fail('unexpected write'));
  const valid = { title: 'Novidade', body: 'Conheça as ferramentas', audience: 'all', enabled: true };
  for (const link_url of ['//evil.example', '/\\evil.example', 'javascript:alert(1)', 'https://evil.example']) {
    await assert.rejects(api.createAdminAnnouncement({ ...valid, link_url }), /link interno/);
  }
  await assert.rejects(api.createAdminAnnouncement({ ...valid, start_at: '2026-10-09', end_at: '2026-10-08' }), /posterior/);
});

test('unavailable announcements cannot be marked read', async () => {
  let writes = 0;
  const api = announcements('free', async (_path, options) => { if (options) writes++; return []; });
  await assert.rejects(api.readAnnouncement('user-1', crypto.randomUUID()), /não disponível/);
  assert.equal(writes, 0);
});

test('favorites are isolated per user and authenticated role has no truncate/update privileges', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      create table auth.users(id uuid primary key);
      alter default privileges in schema public grant all on tables to authenticated;
    `);
    await db.exec(read('../../supabase/migrations/20261008094200_user_favorites_and_account_announcements.sql'));
    await db.exec(read('../../supabase/migrations/20261008224137_restrict_favorite_privileges.sql'));
    const a = crypto.randomUUID(), b = crypto.randomUUID();
    await db.query('insert into auth.users values ($1),($2)', [a,b]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
    await db.exec('set role authenticated');
    await db.query("insert into user_tool_favorites(user_id,tool_slug,tool_title) values ($1,'calculadora-de-porcentagem','Calculadora')", [a]);
    await assert.rejects(db.query("insert into user_tool_favorites(user_id,tool_slug,tool_title) values ($1,'contador-de-palavras','Contador')", [b]), /row-level security/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [b]);
    assert.equal((await db.query('select * from user_tool_favorites')).rows.length, 0);
    assert.equal((await db.query('delete from user_tool_favorites returning *')).rows.length, 0);
    await assert.rejects(db.exec('truncate user_tool_favorites'), /permission denied/);
    await assert.rejects(db.exec("update user_tool_favorites set tool_title='Changed'"), /permission denied/);
    await assert.rejects(db.exec('select * from account_announcements'), /permission denied/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
    assert.equal((await db.query('select * from user_tool_favorites')).rows.length, 1);
    assert.equal((await db.query('delete from user_tool_favorites returning *')).rows.length, 1);
  } finally { await db.close(); }
});
