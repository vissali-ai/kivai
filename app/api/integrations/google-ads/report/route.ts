import { z } from "zod";
import { authenticateBillingUser } from "@/lib/billing/sumup";
import { googleAdsCampaignReport, GoogleAdsConnectionError } from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "private, no-store" };
const requestSchema = z.object({
  connectionId: z.uuid(),
  customerId: z.string().regex(/^\d{10}$/),
  loginCustomerId: z.string().regex(/^\d{10}$/).nullable(),
  from: z.iso.date(),
  to: z.iso.date(),
}).strict().refine(({ from, to }) => from <= to, { message: "Período inválido" });

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return Response.json({ error: "Entre na conta Kivai." }, { status: 401, headers: noStore }); }

  const raw = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Selecione uma conta válida." },
    { status: 400, headers: noStore });

  const input = parsed.data;
  try {
    // O servidor descobre o fuso da conta autorizada na Google Ads API.
    const response = await googleAdsCampaignReport(
      input.connectionId, userId, input.customerId, input.loginCustomerId,
      input.from, input.to,
    );
    return Response.json(response, { headers: noStore });
  } catch (error) {
    const code = error instanceof GoogleAdsConnectionError ? error.code : "UNAVAILABLE";
    const status = error instanceof GoogleAdsConnectionError ? error.status : 503;
    return Response.json({ error:
      code === "GOOGLE_ADS_PERMISSION_DENIED" ? "Sua autorização não permite consultar esta conta." :
      code === "GOOGLE_ADS_QUOTA" ? "Limite de consultas da API atingido." :
      code === "CUSTOMER_NOT_AUTHORIZED" ? "Esta conta não foi autorizada pelo usuário conectado." :
      code === "GOOGLE_AUTH_EXPIRED" ? "Autorização expirada. Reconecte o Google Ads." :
      code === "TOO_MANY_CAMPAIGNS" ? "Este relatório ultrapassa o limite da beta. Reduza o escopo." :
      code === "INVALID_REPORT_PERIOD" ? "Escolha datas válidas de até 366 dias, encerradas no fuso da conta Google Ads." :
      "Não foi possível atualizar o relatório. Tente novamente mais tarde." },
      { status, headers: noStore });
  }
}
