import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";

type DismissedRow = { source_url: string };

export async function listDismissedSuggestionUrls() {
  const records = await supabaseRest<DismissedRow[]>(
    "blog_editorial_dismissed_suggestions?select=source_url&limit=1000",
  );
  return new Set(records.map((record) => record.source_url));
}

export async function dismissEditorialSuggestion(sourceUrl: string) {
  await supabaseRest("blog_editorial_dismissed_suggestions?on_conflict=source_url", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ source_url: sourceUrl }),
  });
}

export async function restoreEditorialSuggestion(sourceUrl: string) {
  await supabaseRest(
    "blog_editorial_dismissed_suggestions?source_url=eq." + encodeURIComponent(sourceUrl),
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
  );
}
