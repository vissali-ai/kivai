import { z } from "zod";
const text = z.string().max(10000);
const publication = z.object({ id: z.string().max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), title: text, network: text, format: text, objective: text, status: text, caption: text, cta: text, hashtags: text, observations: text, createdAt: text, updatedAt: text });
const briefing = z.object({ theme: text, objective: text, audience: text, networks: z.array(text).max(20), message: text, pillar: text, format: text, approach: text, hook: text, topics: z.array(text).max(200), ctaType: text, cta: text, tone: text, status: text });
const common = { id: z.uuid().nullable().optional(), title: z.string().trim().min(1).max(120), clientName: z.string().trim().max(100).default(""), revision: z.number().int().min(1).optional() };
export const projectInput = z.discriminatedUnion("kind", [
  z.object({ ...common, kind: z.literal("calendar"), payload: z.array(publication).max(1000) }),
  z.object({ ...common, kind: z.literal("briefing"), payload: briefing }),
]);
export type SavedProject = { id: string; kind: "calendar" | "briefing"; title: string; client_name: string; payload: unknown; revision: number; updated_at: string };
