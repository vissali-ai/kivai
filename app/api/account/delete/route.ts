import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  let userId = "";
  try {
    userId = (await authenticateBillingUser(request)).id;
  } catch {
    return Response.json({ error: "Faça login novamente para solicitar a exclusão da conta." }, { status: 401, headers });
  }

  const body = await request.json().catch(() => null) as { confirmation?: unknown; feedback?: unknown } | null;
  if (body?.confirmation !== "EXCLUIR") {
    return Response.json({ error: "Confirmação inválida. Digite EXCLUIR para continuar." }, { status: 400, headers });
  }
  const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 1000) : "";

  try {
    const existing = await supabaseRest<Array<{ id: string }>>(
      "account_deletion_requests?select=id&user_id=eq." + encodeURIComponent(userId) + "&status=eq.pending&limit=1",
    );
    if (existing.length) {
      return Response.json({ ok: true, alreadyRequested: true }, { headers });
    }
    await supabaseRest("account_deletion_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: userId, feedback: feedback || null, status: "pending" }),
    });
    return Response.json({ ok: true, requested: true }, { headers });
  } catch (error) {
    // Keep the technical cause in server logs without exposing database details to the client.
    console.error("[account-deletion] request failed", error instanceof Error ? error.message : String(error));
    return Response.json({ error: "Não foi possível processar a solicitação." }, { status: 503, headers });
  }
}
