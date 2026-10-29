import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import { getToolBySlug } from "@/lib/tools";
export type ToolRatingSummary = { ratingValue: number; ratingCount: number };
type RatingRow = { rating: number };
export async function getToolRatingSummary(slug: string): Promise<ToolRatingSummary | null> {
  if (!getToolBySlug(slug)) return null;
  try {
    const rows = await supabaseRest<RatingRow[]>(`tool_ratings?select=rating&tool_slug=eq.${encodeURIComponent(slug)}&limit=10000`, {allowMissingConfig:true});
    if (!rows.length) return null;
    return { ratingCount: rows.length, ratingValue: Math.round((rows.reduce((sum, row) => sum + row.rating, 0) / rows.length) * 10) / 10 };
  } catch { return null; }
}
