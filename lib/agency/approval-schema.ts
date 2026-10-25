import { z } from "zod";

export const approvalDraft = z.object({
  clientName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(3).max(160),
  platform: z.enum(["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "X", "Threads", "Outra"]),
  caption: z.string().trim().max(8000),
  mediaDataUrl: z.string().max(220000).refine(value => !value || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value), "Imagem inválida"),
}).refine(value => Boolean(value.caption || value.mediaDataUrl), "Inclua a legenda ou uma imagem.");
export type ApprovalDraft = z.infer<typeof approvalDraft>;

export const approvalDecision = z.object({
  reviewerName: z.string().trim().min(2).max(120),
  decision: z.enum(["approved", "changes_requested"]),
  feedback: z.string().trim().max(3000),
}).refine(value => value.decision !== "changes_requested" || value.feedback.length >= 5, "Explique os ajustes solicitados.");
export type ApprovalDecision = z.infer<typeof approvalDecision>;

export type ApprovalStatus = "pending" | "approved" | "changes_requested" | "revoked";
export type ApprovalEvent = {
  action: "created" | "approved" | "changes_requested" | "resubmitted" | "revoked";
  version: number; at: string; actor: string; comment?: string;
};
export type ApprovalRecord = ApprovalDraft & {
  id: string; status: ApprovalStatus; version: number; expiresAt: string;
  reviewerName: string; feedback: string; respondedAt: string | null;
  history: ApprovalEvent[]; updatedAt: string; createdAt: string; link?: string;
};
