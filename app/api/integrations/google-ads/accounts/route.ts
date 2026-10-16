import { authenticateBillingUser } from "@/lib/billing/sumup";
import { listGoogleAdsAccounts, GoogleAdsConnectionError } from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return Response.json({ error: "Faça login para consultar contas Google Ads." },
    { status: 401, headers: noStore }); }

  const connectionId = new URL(request.url).searchParams.get("connectionId") ?? "";
  if (!/^[a-f0-9-]{36}$/i.test(connectionId)) {
    return Response.json({ error: "Identificador de conexão inválido." }, { status: 400, headers: noStore });
  }

  try {
    const response = await listGoogleAdsAccounts(connectionId, userId);
    return Response.json(response, { headers: noStore });
  } catch (error) {
    const code = error instanceof GoogleAdsConnectionError ? error.code : "UNAVAILABLE";
    const status = error instanceof GoogleAdsConnectionError ? error.status : 503;
    return Response.json({ error: code === "GOOGLE_AUTH_EXPIRED"
      ? "A autorização Google expirou. Desconecte e conecte novamente."
      : code === "GOOGLE_ADS_PERMISSION_DENIED"
      ? "A conta Google autorizada não possui acesso suficiente ao Google Ads."
      : code === "GOOGLE_ADS_QUOTA"
      ? "Limite de consultas Google Ads atingido. Tente mais tarde."
      : "Não foi possível consultar as contas. Confirme a integração e as permissões." },
      { status, headers: noStore });
  }
}
