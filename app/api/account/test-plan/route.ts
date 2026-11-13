import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
import type { PlanCode } from "@/lib/billing/plan-benefits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const testUserId = "c07f6709-a9a3-45c0-9a89-22076649fd37";
const testEmail = "vissali@gmail.com";
const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status = 400) => Response.json({ error }, { status, headers });

async function authorize(request: Request) {
 const user = await authenticateBillingUser(request);
 if (user.id !== testUserId || user.email?.trim().toLowerCase() !== testEmail) throw new Error("FORBIDDEN");
 return user;
}

type Setting = { user_id: string; plan_code: PlanCode; updated_at: string };

export async function GET(request: Request) {
 try {
  await authorize(request);
  const rows = await supabaseRest<Setting[]>(
   `kivai_test_plan_settings?select=user_id,plan_code,updated_at&user_id=eq.${testUserId}&limit=1`
  );
  if (!rows.length) return failure("Modo de teste não configurado.", 503);
  return Response.json({ enabled: true, plan: rows[0].plan_code, updatedAt: rows[0].updated_at }, { headers });
 } catch (error) {
  const forbidden = error instanceof Error && error.message === "FORBIDDEN";
  const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
  return failure(forbidden ? "Acesso não autorizado." : unauthorized ? "Entre novamente na sua conta." : "Não foi possível consultar o plano de teste.", forbidden ? 403 : unauthorized ? 401 : 503);
 }
}

export async function POST(request: Request) {
 try {
  await authorize(request);
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 150) return failure("Seleção inválida.", 413);
  const payload = JSON.parse(raw) as { plan?: unknown };
  if (payload.plan !== "free" && payload.plan !== "pro" && payload.plan !== "agency") return failure("Selecione Free, Pro ou Agency.");
  const updated = await supabaseRest<Setting[]>(
   `kivai_test_plan_settings?user_id=eq.${testUserId}`,
   { method: "PATCH", headers: { Prefer: "return=representation" },
     body: JSON.stringify({ plan_code: payload.plan, updated_at: new Date().toISOString() }) }
  );
  if (updated.length !== 1) return failure("Não foi possível alterar o plano de teste.", 503);
  return Response.json({ enabled: true, plan: updated[0].plan_code }, { headers });
 } catch (error) {
  const forbidden = error instanceof Error && error.message === "FORBIDDEN";
  const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
  return failure(forbidden ? "Acesso não autorizado." : unauthorized ? "Entre novamente na sua conta." : "Não foi possível alterar o plano de teste.", forbidden ? 403 : unauthorized ? 401 : 503);
 }
}
