import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import { getToolBySlug } from "@/lib/tools";
import { getPublishedSiteContentByPath } from "@/lib/site-cms/repository";
export type ToolRatingSummary = { ratingValue: number; ratingCount: number };
type RatingAggregateRow = { rating_value: number | string | null; rating_count: number | string };
export async function getToolRatingSummary(slug: string): Promise<ToolRatingSummary | null> {
  if (!(await getRateableTool(slug))) return null;
  try {
    const rows = await supabaseRest<RatingAggregateRow[]>("rpc/kivai_tool_rating_summary", {
      method:"POST", body:JSON.stringify({p_slug:slug}), allowMissingConfig:true
    });
    const item = rows[0];
    if (!item || Number(item.rating_count) < 1) return null;
    return { ratingCount:Number(item.rating_count), ratingValue:Number(item.rating_value) };
  } catch { return null; }
}

export async function getRateableTool(slug: string): Promise<{name:string; description:string} | null> {
  if (!/^[a-z0-9-]{2,100}$/.test(slug)) return null;
  const registered = getToolBySlug(slug);
  if (registered) return {name:registered.name, description:registered.seoDescription ?? registered.description};
  const published = await getPublishedSiteContentByPath(`/ferramentas/${slug}`);
  if (published?.contentType !== "tool") return null;
  return {name:published.title,description:published.seoDescription || published.shortDescription};
}
