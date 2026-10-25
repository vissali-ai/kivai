import { z } from "zod";
import { authenticateBillingUser } from "@/lib/billing/sumup";
import { getAccountAccess } from "@/lib/billing/access";
import { approvalDraft } from "@/lib/agency/approval-schema";
import { createApproval, listApprovals, changeOwnerApproval, getApprovalVersions } from "@/lib/agency/approvals";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
function fail(error: string, status: number) { return Response.json({ error }, { status, headers }); }
async function agency(request: Request) {
  const user = await authenticateBillingUser(request);
  if ((await getAccountAccess(user.id)).plan !== "agency") throw Error("AGENCY_REQUIRED");
  return user.id;
}
function accessError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "AGENCY_REQUIRED") return fail("Este recurso é exclusivo de assinantes Agency ativos.", 403);
  if (message === "UNAUTHORIZED") return fail("Entre na sua conta.", 401);
  if (message === "CLIENT_LIMIT") return fail("Limite de 20 clientes atingido.", 409);
  if (message === "APPROVAL_LIMIT") return fail("Limite de 200 solicitações atingido.", 409);
  return fail("Não foi possível acessar as aprovações. Tente novamente.", 503);
}
export async function GET(request: Request) {
  try {
    const userId = await agency(request);
    const versionId = new URL(request.url).searchParams.get("versions");
    if (versionId) {
      if (!z.uuid().safeParse(versionId).success) return fail("Solicitação inválida.", 400);
      return Response.json({ versions: await getApprovalVersions(userId, versionId) }, { headers });
    }
    return Response.json({ approvals: await listApprovals(userId) }, { headers });
  }
  catch (error) { return accessError(error); }
}
export async function POST(request: Request) {
  try {
    const userId = await agency(request);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 245000) return fail("Imagem muito grande. Reduza o arquivo.", 413);
    const parsed = approvalDraft.safeParse(JSON.parse(raw));
    if (!parsed.success) return fail("Informe cliente, título, legenda ou imagem válida.", 400);
    return Response.json({ approval: await createApproval(userId, parsed.data) }, { status: 201, headers });
  } catch (error) { if (error instanceof SyntaxError) return fail("Dados inválidos.", 400); return accessError(error); }
}
const ownerChange = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revoke"), id: z.uuid() }),
  z.object({ action: z.literal("resubmit"), id: z.uuid(), draft: approvalDraft }),
]);
export async function PATCH(request: Request) {
  try {
    const userId = await agency(request);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 245000) return fail("Imagem muito grande. Reduza o arquivo.", 413);
    const parsed = ownerChange.safeParse(JSON.parse(raw));
    if (!parsed.success) return fail("Dados de revisão inválidos.", 400);
    const { id, action } = parsed.data;
    const approval = await changeOwnerApproval(userId, id, action, action === "resubmit" ? parsed.data.draft : undefined);
    if (!approval) return fail("A solicitação foi alterada ou não está disponível.", 409);
    return Response.json({ approval }, { headers });
  } catch (error) { if (error instanceof SyntaxError) return fail("Dados inválidos.", 400); return accessError(error); }
}
