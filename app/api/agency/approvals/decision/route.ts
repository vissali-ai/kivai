import { z } from "zod";
import { approvalDecision } from "@/lib/agency/approval-schema";
import { decideApproval } from "@/lib/agency/approvals";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const payload = approvalDecision.and(z.object({ token: z.string().min(50).max(100) }));
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 9000) return Response.json({ error: "Dados acima do limite." }, { status: 413, headers });
    const parsed = payload.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "Informe seu nome e, caso solicite ajustes, descreva o que precisa mudar." }, { status: 400, headers });
    const { token, reviewerName, decision, feedback } = parsed.data;
    const updated = await decideApproval(token, reviewerName, decision, feedback);
    if (!updated) return Response.json({ error: "Link inválido, expirado ou já respondido. Solicite um novo link à agência." }, { status: 409, headers });
    return Response.json({ status: updated.status }, { headers });
  } catch {
    return Response.json({ error: "Não foi possível registrar a decisão. Tente novamente." }, { status: 503, headers });
  }
}
