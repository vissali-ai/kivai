import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { getAiCreditBalance } from "@/lib/ai/credits";
import { aiCreditSalesEnabled } from "@/lib/ai/packs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = (await authenticateBillingUser(request)).id;
  } catch {
    return Response.json({ error: "Faça login no Kivai para consultar seus créditos." }, { status: 401 });
  }

  try {
    const wallet = await getAiCreditBalance(userId);
    return Response.json({ wallet, salesEnabled: aiCreditSalesEnabled() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("[kivai-ai] Credit balance unavailable");
    return Response.json(
      { error: "Não foi possível consultar os créditos no momento." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
