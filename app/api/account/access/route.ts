import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { getAccountAccess } from "@/lib/billing/access";
import { FREE_PUBLIC_MODE } from "@/lib/billing/availability";
export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const access = await getAccountAccess(user.id);
    return Response.json({ userId: user.id, ...access, publicFreeMode: FREE_PUBLIC_MODE }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return Response.json({ error: unauthorized ? "Faça login para continuar." : "Não foi possível consultar seu plano. Tente novamente." }, { status: unauthorized ? 401 : 503 });
  }
}
