import { authenticateBillingUser } from "@/lib/billing/sumup";
import { getAccountAccess } from "@/lib/billing/access";
export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    return Response.json({ userId: user.id, ...await getAccountAccess(user.id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return Response.json({ error: unauthorized ? "Faça login para continuar." : "Não foi possível consultar seu plano. Tente novamente." }, { status: unauthorized ? 401 : 503 });
  }
}
