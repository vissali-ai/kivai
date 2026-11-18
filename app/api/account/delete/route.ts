import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
import { blogConfig } from "@/lib/blog/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  let userId = "";
  try {
    userId = (await authenticateBillingUser(request)).id;
  } catch {
    return Response.json({ error: "Faça login novamente para excluir sua conta." }, { status: 401, headers });
  }

  const body = await request.json().catch(() => null) as { confirmation?: unknown; feedback?: unknown } | null;
  if (body?.confirmation !== "EXCLUIR") {
    return Response.json({ error: "Confirmação inválida. Digite EXCLUIR para continuar." }, { status: 400, headers });
  }
  const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 1000) : "";

  try {
    const activeSubscriptions = await supabaseRest<Array<{ id: string }>>(
      "user_subscriptions?select=id&user_id=eq." + encodeURIComponent(userId) +
      "&status=eq.active&or=(current_period_end.is.null,current_period_end.gt." + encodeURIComponent(new Date().toISOString()) + ")&limit=1",
    );
    if (activeSubscriptions.length) {
      return Response.json({
        error: "Existe uma assinatura ativa vinculada à sua conta. Solicite o cancelamento da renovação em Minha assinatura e pagamentos e aguarde a confirmação antes de excluir a conta.",
      }, { status: 409, headers });
    }

    const deleted = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${blogConfig.serviceRoleKey}` },
      cache: "no-store",
    });
    if (!deleted.ok) {
      console.error("account_deletion_auth_failed", deleted.status);
      return Response.json({ error: "Não foi possível concluir a exclusão da conta. Tente novamente ou fale com o atendimento." }, { status: 503, headers });
    }

    if (feedback && blogConfig.supabaseUrl && blogConfig.serviceRoleKey) {
      try {
        await supabaseRest("account_deletion_feedback", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ feedback }),
        });
      } catch {
        console.error("account_deletion_feedback_persist_failed");
      }
    }

    return Response.json({ ok: true }, { headers });
  } catch {
    console.error("account_deletion_failed");
    return Response.json({ error: "Não foi possível concluir a exclusão da conta. Tente novamente." }, { status: 503, headers });
  }
}
