import { authenticateBillingUser } from "@/lib/billing/sumup";
import { listUserAnnouncements, readAnnouncement } from "@/lib/account/announcements";

const noStore = { "Cache-Control": "private, no-store" };

function errorResult(error: unknown) {
  const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
  return Response.json(
    { error: unauthorized ? "Faça login para continuar." : "Não foi possível consultar os avisos." },
    { status: unauthorized ? 401 : 503, headers: noStore }
  );
}

export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    return Response.json({ notices: await listUserAnnouncements(user.id) }, { headers: noStore });
  } catch (error) { return errorResult(error); }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await request.json().catch(() => null) as { id?: unknown } | null;
    const id = body?.id;
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) {
      return Response.json({ error: "Aviso inválido." }, { status: 400, headers: noStore });
    }
    await readAnnouncement(user.id, id);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) { return errorResult(error); }
}
