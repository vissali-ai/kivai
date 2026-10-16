import { z } from "zod";
import { authenticateBillingUser } from "@/lib/billing/sumup";
import {
  deleteGoogleAdsConnection, googleAdsConnectionsForUser,
  GoogleAdsConnectionError,
} from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" };
const paramsSchema = z.object({ connectionId: z.uuid() }).strict();

export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const connections = await googleAdsConnectionsForUser(user.id);
    return Response.json({ connections }, { headers: noStore });
  } catch {
    return Response.json({ error: "Não foi possível carregar as conexões. Confira sua autenticação." },
      { status: 401, headers: noStore });
  }
}

export async function DELETE(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return Response.json({ error: "Faça login para desconectar." }, { status: 401, headers: noStore }); }
  const data = await request.json().catch(() => null);
  const parsed = paramsSchema.safeParse(data);
  if (!parsed.success) return Response.json({ error: "Conexão inválida." }, { status: 400, headers: noStore });
  try {
    await deleteGoogleAdsConnection(parsed.data.connectionId, userId);
    return Response.json({ disconnected: true }, { headers: noStore });
  } catch (error) {
    const status = error instanceof GoogleAdsConnectionError ? error.status : 503;
    return Response.json({ error: "Não foi possível desconectar esta conta." }, { status, headers: noStore });
  }
}
