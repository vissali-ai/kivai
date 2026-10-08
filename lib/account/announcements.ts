import "server-only";

import { getAccountAccess } from "@/lib/billing/access";
import { supabaseRest } from "@/lib/blog/supabase";

export type Audience = "all" | "free" | "pro" | "agency";
export type AccountAnnouncement = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  audience: Audience;
  enabled: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

type ReadRow = { announcement_id: string };
export type UserAnnouncement = AccountAnnouncement & { read: boolean };

export async function listAdminAnnouncements(): Promise<AccountAnnouncement[]> {
  return supabaseRest<AccountAnnouncement[]>(
    "account_announcements?select=*&order=created_at.desc&limit=150"
  );
}

export async function listUserAnnouncements(userId: string): Promise<UserAnnouncement[]> {
  const [access, notices, reads] = await Promise.all([
    getAccountAccess(userId),
    supabaseRest<AccountAnnouncement[]>("account_announcements?select=*&enabled=eq.true&order=created_at.desc&limit=150"),
    supabaseRest<ReadRow[]>(
      `account_announcement_reads?select=announcement_id&user_id=eq.${encodeURIComponent(userId)}&limit=500`
    ),
  ]);
  const readIds = new Set(reads.map((row) => row.announcement_id));
  const now = Date.now();
  return notices.filter((notice) =>
    (notice.audience === "all" || notice.audience === access.plan) &&
    (!notice.start_at || Date.parse(notice.start_at) <= now) &&
    (!notice.end_at || Date.parse(notice.end_at) > now)
  ).map((notice) => ({ ...notice, read: readIds.has(notice.id) }));
}

export async function readAnnouncement(userId: string, announcementId: string): Promise<void> {
  const notices = await listUserAnnouncements(userId);
  if (!notices.some((notice) => notice.id === announcementId)) {
    throw new Error("Aviso não disponível para esta conta.");
  }
  await supabaseRest("account_announcement_reads?on_conflict=user_id,announcement_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, announcement_id: announcementId }),
  });
}

function validatedInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Dados do aviso inválidos.");
  const source = input as Record<string, unknown>;
  const title = typeof source.title === "string" ? source.title.trim() : "";
  const body = typeof source.body === "string" ? source.body.trim() : "";
  const rawLink = typeof source.link_url === "string" ? source.link_url.trim() : "";
  const audience = source.audience;
  if (title.length < 3 || title.length > 140) throw new Error("Título deve ter de 3 a 140 caracteres.");
  if (body.length < 3 || body.length > 1500) throw new Error("Mensagem deve ter de 3 a 1500 caracteres.");
  if (rawLink && (!/^\/(?!\/)[a-zA-Z0-9/?#&=_%.-]*$/.test(rawLink) || rawLink.length > 300)) {
    throw new Error("Use apenas um link interno do Kivai, começando com /.");
  }
  if (!["all", "free", "pro", "agency"].includes(String(audience))) throw new Error("Público inválido.");
  if (typeof source.enabled !== "boolean") throw new Error("Informe se o aviso ficará ativo.");
  const parseDate = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("Data do aviso inválida.");
    return new Date(value).toISOString();
  };
  const start_at = parseDate(source.start_at);
  const end_at = parseDate(source.end_at);
  if (start_at && end_at && end_at <= start_at) throw new Error("O término deve ser posterior ao início.");
  return {
    title, body, link_url: rawLink || null, audience: audience as Audience,
    enabled: source.enabled, start_at, end_at,
    updated_at: new Date().toISOString(),
  };
}

export async function createAdminAnnouncement(input: unknown) {
  const payload = validatedInput(input);
  const result = await supabaseRest<AccountAnnouncement[]>("account_announcements", {
    method: "POST", body: JSON.stringify(payload),
  });
  return result[0];
}

export async function updateAdminAnnouncement(id: string, input: unknown) {
  const payload = validatedInput(input);
  const result = await supabaseRest<AccountAnnouncement[]>(
    `account_announcements?id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  if (!result.length) throw new Error("Aviso não encontrado.");
  return result[0];
}

export async function deleteAdminAnnouncement(id: string) {
  await supabaseRest(`account_announcements?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}
