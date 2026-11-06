import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../../supabase/migrations/20261105193000_asaas_recurring_sync.sql", import.meta.url), "utf8");
const userId = "11111111-1111-4111-8111-111111111111";
const subscriptionId = "sub_asaas_sandbox_00001";

async function createDatabase() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE TYPE public.kivai_plan_code AS ENUM ('free', 'pro', 'agency');
    CREATE TABLE public.user_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id),
      plan_code public.kivai_plan_code NOT NULL,
      status text NOT NULL,
      provider text,
      provider_customer_id text,
      provider_subscription_id text,
      billing_cycle text,
      current_period_start timestamptz NOT NULL DEFAULT now(),
      current_period_end timestamptz NOT NULL,
      cancel_at_period_end boolean DEFAULT false,
      grace_until timestamptz,
      test_access boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE public.user_profiles (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id),
      plan_code public.kivai_plan_code DEFAULT 'free',
      lifecycle_stage text,
      updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE public.customer_marketing_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id),
      event_type text,
      description text,
      metadata jsonb
    );
  `);
  await db.exec(migration);
  await db.query("INSERT INTO auth.users(id) VALUES ($1)", [userId]);
  await db.query("INSERT INTO public.user_profiles(user_id) VALUES ($1)", [userId]);
  await db.query(`INSERT INTO public.kivai_recurring_provider_links
    (user_id, provider_subscription_id, plan_code, billing_cycle, expected_amount_brl)
    VALUES ($1, $2, 'pro', 'monthly', 19.90)`, [userId, subscriptionId]);
  return db;
}

async function apply(db, paymentId, amount = 19.90) {
  const { rows } = await db.query(
    "SELECT public.kivai_apply_asaas_paid_charge($1,$2,$3,$4) AS result",
    [paymentId, subscriptionId, amount, "event_" + paymentId]
  );
  return rows[0].result;
}

test("Asaas migration runs in a real isolated PostgreSQL engine and applies first paid period", async () => {
  const db = await createDatabase();
  try {
    const result = await apply(db, "pay_test_00001");
    assert.equal(result.applied, true);
    const subscription = (await db.query("SELECT plan_code, provider, status FROM public.user_subscriptions")).rows[0];
    assert.equal(subscription.plan_code, "pro");
    assert.equal(subscription.provider, "asaas");
    assert.equal(subscription.status, "active");
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.kivai_recurring_paid_charges")).rows[0].n, 1);
    assert.equal((await db.query("SELECT plan_code FROM public.user_profiles WHERE user_id=$1", [userId])).rows[0].plan_code, "pro");
  } finally { await db.close(); }
});

test("same Asaas payment is idempotent and next distinct payment renews", async () => {
  const db = await createDatabase();
  try {
    const first = await apply(db, "pay_test_00002");
    const repeated = await apply(db, "pay_test_00002");
    const next = await apply(db, "pay_test_00003");
    assert.equal(first.applied, true);
    assert.equal(repeated.applied, false);
    assert.equal(repeated.reason, "already_processed");
    assert.equal(next.applied, true);
    assert.ok(new Date(next.period_end) > new Date(first.period_end));
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.kivai_recurring_paid_charges")).rows[0].n, 2);
  } finally { await db.close(); }
});

test("incorrect amount and active other-provider subscription never create a paid charge", async () => {
  const db = await createDatabase();
  try {
    await assert.rejects(() => apply(db, "pay_wrong_00001", 0.01), /Valor divergente/);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.kivai_recurring_paid_charges")).rows[0].n, 0);
    await db.query(`INSERT INTO public.user_subscriptions
      (user_id, plan_code, status, provider, current_period_end)
      VALUES ($1, 'pro', 'active', 'external_recurring', now() + interval '30 days')`, [userId]);
    await assert.rejects(() => apply(db, "pay_other_00001"), /outro provedor/);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.kivai_recurring_paid_charges")).rows[0].n, 0);
  } finally { await db.close(); }
});

test("unauthorized roles cannot execute recurring charge RPC", async () => {
  const db = await createDatabase();
  try {
    const { rows } = await db.query(`SELECT has_function_privilege(
      'authenticated', 'public.kivai_apply_asaas_paid_charge(text,text,numeric,text)', 'EXECUTE'
    ) AS allowed`);
    assert.equal(rows[0].allowed, false);
  } finally { await db.close(); }
});
