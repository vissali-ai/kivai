import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { supabaseRest } from "@/lib/blog/supabase";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as { scope?: string; ids?: string[]; deleteAll?: boolean };
    const scope = body.scope;
    if (!["inbox", "sent", "discarded"].includes(String(scope))) throw new Error("Aba inválida.");
    const deleteAll = body.deleteAll === true;
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!deleteAll && (!ids.length || ids.length > 200 || ids.some(id => typeof id !== "string"))) throw new Error("Selecione ao menos um e-mail.");
    const deleted = { deletedInbox: 0, deletedSent: 0 };
    if (scope === "inbox" || scope === "discarded") {
      const selectedIds = deleteAll ? [] : ids.map(id => scope === "discarded" ? id.split(":") : ["inbox", id]).filter(parts => parts[0] === "inbox").map(parts => parts[1]);
      if (!deleteAll && selectedIds.some(id => !uuid.test(id))) throw new Error("Identificador de mensagem inválido.");
      const filter = deleteAll
        ? scope === "inbox" ? "discarded_at=is.null" : "discarded_at=not.is.null"
        : `id=in.(${selectedIds.join(",")})&discarded_at=${scope === "inbox" ? "is.null" : "not.is.null"}`;
      if (deleteAll || selectedIds.length) {
        await supabaseRest(`customer_inbox_messages?${filter}`, { method: "DELETE" });
        deleted.deletedInbox = selectedIds.length;
      }
    }
    if (scope === "sent" || scope === "discarded") {
      const selectedIds = deleteAll ? [] : ids.map(id => scope === "discarded" ? id.split(":") : ["sent", id]).filter(parts => parts[0] === "sent").map(parts => parts[1]);
      if (!deleteAll && selectedIds.some(id => !uuid.test(id))) throw new Error("Identificador de envio inválido.");
      const filter = deleteAll
        ? `channel=eq.email&discarded_at=${scope === "sent" ? "is.null" : "not.is.null"}`
        : `id=in.(${selectedIds.join(",")})&channel=eq.email&discarded_at=${scope === "sent" ? "is.null" : "not.is.null"}`;
      if (deleteAll || selectedIds.length) {
        await supabaseRest(`customer_communications?${filter}`, { method: "DELETE" });
        deleted.deletedSent = selectedIds.length;
      }
    }
    return NextResponse.json({ ok: true, ...deleted, deleteAll }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
