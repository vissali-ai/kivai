import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";

const availableKinds = [
  "post_creator", "calendar", "briefing", "social_report", "preview_post",
  "engagement", "post_analysis", "trend_radar", "roas", "roi",
  "margin", "markup", "proofreader", "qr_code", "watermark",
] as const;
const allowedKinds = new Set<string>(availableKinds);
const defaults = ["post_creator", "calendar", "briefing", "social_report"];
const headers = { "Cache-Control": "private, no-store" };
type ShortcutRecord = { user_id: string; tool_kinds: string[]; updated_at: string };

function errorResponse(error: unknown) {
  const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
  return Response.json({ error: unauthorized
    ? "Faça login para personalizar suas ferramentas."
    : "Não foi possível acessar suas preferências. Tente novamente." },
    { status: unauthorized ? 401 : 503, headers });
}
export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const rows = await supabaseRest<ShortcutRecord[]>(
      `account_project_shortcuts?select=tool_kinds&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    );
    const saved = rows[0]?.tool_kinds;
    const toolKinds = Array.isArray(saved) && saved.length > 0 && saved.every(item => allowedKinds.has(item))
      ? saved : defaults;
    return Response.json({ toolKinds }, { headers });
  } catch (error) { return errorResponse(error); }
}
export async function PUT(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2048)
      return Response.json({ error: "Seleção inválida." }, { status: 400, headers });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { body = null; }
    const toolKinds = body && typeof body === "object" && "toolKinds" in body ? body.toolKinds : null;
    if (!Array.isArray(toolKinds) || toolKinds.length < 1 || toolKinds.length > 6 ||
        !toolKinds.every((kind: unknown) => typeof kind === "string" && allowedKinds.has(kind)) ||
        new Set(toolKinds).size !== toolKinds.length) {
      return Response.json({ error: "Selecione entre uma e seis ferramentas válidas, sem repetição." }, { status: 400, headers });
    }
    const rows = await supabaseRest<ShortcutRecord[]>("account_project_shortcuts?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ user_id: user.id, tool_kinds: toolKinds }),
    });
    if (!rows[0]) throw new Error("PREFERENCE_WRITE_FAILED");
    return Response.json({ toolKinds: rows[0].tool_kinds }, { headers });
  } catch (error) { return errorResponse(error); }
}
