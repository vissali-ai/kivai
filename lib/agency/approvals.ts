import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";
import { SITE_URL } from "@/lib/seo";
import type { ApprovalDraft, ApprovalEvent, ApprovalRecord, ApprovalStatus } from "@/lib/agency/approval-schema";

type Row = {
  id: string; user_id: string; client_name: string; title: string; platform: ApprovalDraft["platform"];
  caption: string; media_data_url: string; status: ApprovalStatus; version: number;
  expires_at: string; reviewer_name: string; feedback: string; responded_at: string | null;
  history: ApprovalEvent[]; created_at: string; updated_at: string;
};
const fields = "id,user_id,client_name,title,platform,caption,media_data_url,status,version,expires_at,reviewer_name,feedback,responded_at,history,created_at,updated_at";
function signature(id: string, version: number) {
  return createHmac("sha256", blogConfig.serviceRoleKey).update(`kivai-agency-approval:v1:${id}:${version}`).digest("base64url");
}
export function createApprovalToken(row: Pick<Row, "id" | "version">) {
  return `${row.id}.${signature(row.id, row.version)}`;
}
export function approvalLink(row: Pick<Row, "id" | "version">) {
  return `${SITE_URL}/aprovar/${createApprovalToken(row)}`;
}
function map(row: Row, includeLink = false): ApprovalRecord {
  return {
    id: row.id, clientName: row.client_name, title: row.title, platform: row.platform,
    caption: row.caption, mediaDataUrl: row.media_data_url, status: row.status,
    version: row.version, expiresAt: row.expires_at, reviewerName: row.reviewer_name,
    feedback: row.feedback, respondedAt: row.responded_at, history: row.history ?? [],
    createdAt: row.created_at, updatedAt: row.updated_at,
    ...(includeLink && row.status === "pending" ? { link: approvalLink(row) } : {}),
  };
}
export async function listApprovals(userId: string): Promise<ApprovalRecord[]> {
  const rows = await supabaseRest<Row[]>(`agency_content_approvals?select=${fields}&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=200`);
  return rows.map(row => map(row, true));
}
export async function getOwnerApproval(userId: string, id: string): Promise<Row | null> {
  const rows = await supabaseRest<Row[]>(`agency_content_approvals?select=${fields}&user_id=eq.${encodeURIComponent(userId)}&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ?? null;
}
export async function getApprovalByToken(token: string): Promise<ApprovalRecord | null> {
  const parts = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!parts) return null;
  const rows = await supabaseRest<Row[]>(`agency_content_approvals?select=${fields}&id=eq.${encodeURIComponent(parts[1])}&limit=1`);
  const row = rows[0];
  if (!row) return null;
  const expected = Buffer.from(signature(row.id, row.version));
  const actual = Buffer.from(parts[2]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return map(row);
}
export function approvalActive(row: ApprovalRecord) {
  return row.status === "pending" && Date.parse(row.expiresAt) > Date.now();
}
export async function createApproval(userId: string, draft: ApprovalDraft): Promise<ApprovalRecord> {
  const rows = await listApprovals(userId);
  const names = new Set(rows.map(row => row.clientName.toLocaleLowerCase("pt-BR")));
  if (!names.has(draft.clientName.toLocaleLowerCase("pt-BR")) && names.size >= 20) throw Error("CLIENT_LIMIT");
  if (rows.length >= 200) throw Error("APPROVAL_LIMIT");
  const now = new Date().toISOString();
  const inserted = await supabaseRest<Row[]>("agency_content_approvals", {
    method: "POST", body: JSON.stringify({
      user_id: userId, client_name: draft.clientName, title: draft.title, platform: draft.platform,
      caption: draft.caption, media_data_url: draft.mediaDataUrl,
      history: [{ action: "created", version: 1, at: now, actor: "Agência" }],
    }),
  });
  return map(inserted[0], true);
}
export async function changeOwnerApproval(userId: string, id: string, action: "revoke" | "resubmit", draft?: ApprovalDraft): Promise<ApprovalRecord | null> {
  const row = await getOwnerApproval(userId, id);
  if (!row || row.status === "revoked" && action === "revoke") return null;
  if (action === "resubmit" && !draft) return null;
  const now = new Date().toISOString();
  const nextVersion = row.version + 1;
  const history: ApprovalEvent[] = [...(row.history ?? []), { action: action === "revoke" ? "revoked" : "resubmitted", version: nextVersion, at: now, actor: "Agência" }];
  const patch = action === "revoke"
    ? { status: "revoked", version: nextVersion, history, updated_at: now }
    : { status: "pending", version: nextVersion, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), client_name: draft!.clientName,
        title: draft!.title, platform: draft!.platform, caption: draft!.caption, media_data_url: draft!.mediaDataUrl,
        reviewer_name: "", feedback: "", responded_at: null, history, updated_at: now };
  const updated = await supabaseRest<Row[]>(`agency_content_approvals?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&version=eq.${row.version}`, {
    method: "PATCH", body: JSON.stringify(patch),
  });
  return updated[0] ? map(updated[0], true) : null;
}
export async function decideApproval(token: string, reviewerName: string, decision: "approved" | "changes_requested", feedback: string): Promise<ApprovalRecord | null> {
  const row = await getApprovalByToken(token);
  if (!row || !approvalActive(row)) return null;
  const now = new Date().toISOString();
  const history: ApprovalEvent[] = [...row.history, { action: decision, version: row.version, at: now, actor: reviewerName, ...(feedback ? { comment: feedback } : {}) }];
  const updated = await supabaseRest<Row[]>(`agency_content_approvals?id=eq.${encodeURIComponent(row.id)}&version=eq.${row.version}&status=eq.pending&expires_at=gt.${encodeURIComponent(now)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: decision, reviewer_name: reviewerName, feedback, responded_at: now, history, updated_at: now }),
  });
  return updated[0] ? map(updated[0]) : null;
}
