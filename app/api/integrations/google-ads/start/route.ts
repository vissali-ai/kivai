import { authenticateBillingUser } from "@/lib/billing/sumup";
import { makeGoogleAdsConsentUrl, GoogleAdsConnectionError } from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const url = await makeGoogleAdsConsentUrl(user.id);
    return Response.json({ authorizationUrl: url }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = error instanceof GoogleAdsConnectionError ? error.status : 503;
    return Response.json({
      error: status === 503 ? "Conexão OAuth ainda não ativada. Confirme o banco e as credenciais na Vercel." :
        "Faça login na conta Kivai e tente novamente.",
    }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
