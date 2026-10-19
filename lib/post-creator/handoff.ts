import { z } from "zod";
import { getStoredSession } from "@/lib/user-auth";
import { postPlatforms } from "./schema";
const KEY = "kivai:post-creator:preview:v1";
const transferSchema = z.object({
  createdAt: z.number(), userId: z.string(), caption: z.string().max(5000), platform: z.enum(postPlatforms),
  format: z.enum(["square", "portrait", "story"]),
  image: z.string().max(2_500_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
});
export type PostTransfer = z.infer<typeof transferSchema>;
const owner = () => getStoredSession()?.user?.id ?? "guest";
export function sendPostToPreview(data: Omit<PostTransfer, "createdAt" | "userId">) {
  sessionStorage.setItem(KEY, JSON.stringify(transferSchema.parse({ ...data, createdAt: Date.now(), userId: owner() })));
}
export function readPostTransfer(): PostTransfer | null {
  try { const data = transferSchema.parse(JSON.parse(sessionStorage.getItem(KEY) ?? "null")); if (data.userId === owner() && Date.now() - data.createdAt < 600_000) return data; } catch { /* Invalid or expired draft is never applied. */ }
  clearPostTransfer(); return null;
}
export function clearPostTransfer() { try { sessionStorage.removeItem(KEY); } catch { /* Storage may be blocked. */ } }
