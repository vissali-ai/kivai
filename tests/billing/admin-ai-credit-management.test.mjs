import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(new URL("../../supabase/migrations/20261110130000_admin_ai_credit_adjustments.sql", import.meta.url), "utf8");
const action = fs.readFileSync(new URL("../../app/admin/creditos-ia/actions.ts", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/admin/creditos-ia/page.tsx", import.meta.url), "utf8");
const nav = fs.readFileSync(new URL("../../components/admin/admin-shell.tsx", import.meta.url), "utf8");

test("manual credit adjustment is separate from InfinitePay fulfillment and authenticated as admin", () => {
  assert.match(action, /await assertAdminApi\(\)/);
  assert.match(action, /rpc\/kivai_admin_adjust_ai_credits/);
  assert.match(action, /confirmation !== "CONFIRMAR"/);
  assert.match(action, /already_applied/);
  assert.doesNotMatch(action, /grant_ai_credit_order|transaction_nsu|payment_check/);
});
test("admin credit ledger is service-only and atomically idempotent", () => {
  assert.match(migration, /ai_credit_admin_adjustments/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.ai_credit_admin_adjustments from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.kivai_admin_adjust_ai_credits\(uuid,uuid,integer,text,text\)/);
  assert.match(migration, /to service_role/);
  assert.match(migration, /for update/);
  assert.match(migration, /ADMIN_CREDIT_IDEMPOTENCY_CONFLICT/);
  assert.match(migration, /INSUFFICIENT_PURCHASED_CREDIT_BALANCE/);
  assert.match(migration, /balance_after = balance_before \+ delta/);
});
test("admin screen exposes search, balances, purchase ledger, usage and required reason", () => {
  assert.match(nav, /href: "\/admin\/creditos-ia", label: "Gerenciar Créditos de IA"/);
  assert.match(page, /getAiCreditBalance\(selected.id\)/);
  assert.match(page, /ai_credit_admin_adjustments\?select/);
  assert.match(page, /ai_credit_orders\?select/);
  assert.match(page, /ai_credit_operations\?select/);
  assert.match(page, /minLength=\{10\}/);
  assert.match(page, /name="operationId"/);
});
