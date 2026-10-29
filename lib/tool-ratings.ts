import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import { getToolBySlug } from "@/lib/tools";
export type ToolRatingSummary = { ratingValue: number; ratingCount: number };
type RatingAggregateRow = { rating_value: number | string | null; rating_count: number | string };
export async function getToolRatingSummary(slug: string): Promise<ToolRatingSummary | null> {
  if (!getToolBySlug(slug)) return null;
  try {
    const rows = await supabaseRest<RatingAggregateRow[]>("rpc/kivai_tool_rating_summary", {
      method:"POST", body:JSON.stringify({p_slug:slug}), allowMissingConfig:true
    });
    const item = rows[0];
    if (!item || Number(item.rating_count) < 1) return null;
    return { ratingCount:Number(item.rating_count), ratingValue:Number(item.rating_value) };
  } catch { return null; }
}
