import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseRest } from "@/lib/blog/supabase";
import { isValidAdminSession, TRAFEGO_ADMIN_COOKIE } from "@/lib/trafego/admin";

const STATUSES = new Set(["new", "contacted", "negotiation", "won", "lost"]);

async function authorized() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(TRAFEGO_ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const leads = await supabaseRest("trafego_leads?select=*&order=created_at.desc&limit=200");
  return NextResponse.json({ leads });
}

export async function PATCH(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = (await request.json()) as { id?: unknown; status?: unknown; admin_notes?: unknown };
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
      return NextResponse.json({ error: "Lead inválido." }, { status: 400 });
    }
    if (body.status !== undefined && (typeof body.status !== "string" || !STATUSES.has(body.status))) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    if (body.admin_notes !== undefined && (typeof body.admin_notes !== "string" || body.admin_notes.length > 5000)) {
      return NextResponse.json({ error: "Observações inválidas." }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.status === "string") {
      patch.status = body.status;
      const now = new Date().toISOString();
      if (body.status === "contacted") patch.contacted_at = now;
      if (body.status === "negotiation") patch.negotiation_at = now;
      if (body.status === "won") patch.won_at = now;
      if (body.status === "lost") patch.lost_at = now;
    }
    if (typeof body.admin_notes === "string") patch.admin_notes = body.admin_notes.trim().slice(0, 5000);

    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });

    const updated = await supabaseRest(`trafego_leads?id=eq.${encodeURIComponent(body.id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return NextResponse.json({ ok: true, lead: updated });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o lead." }, { status: 500 });
  }
}
