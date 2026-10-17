import { authenticateBillingUser } from "@/lib/billing/sumup";
import { trafficBetaBalance } from "@/lib/ai/traffic-beta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = (await authenticateBillingUser(request)).id;
  } catch {
    return Response.json({ error: "Entre na sua conta para consultar os créditos beta." }, {
      status: 401, headers: { "Cache-Control": "private, no-store" },
    });
  }
  try {
    const wallet = await trafficBetaBalance(userId);
    return Response.json({ wallet, pricePerAnalysis: 1 }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "A carteira beta ainda não está disponível." }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
}
