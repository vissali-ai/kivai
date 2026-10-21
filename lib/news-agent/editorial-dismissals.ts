import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";

type DismissedRow = { source_url: string };

export async function listDismissedSuggestionUrls() {
  const urls = new Set<string>();
  let offset = 0;
  while (true) {
    const records = await supabaseRest<DismissedRow[]>(
      `blog_editorial_dismissed_suggestions?select=source_url&order=source_url.asc&limit=500&offset=${offset}`,
    );
    if (!records.length) return urls;
    for (const record of records) urls.add(record.source_url);
    offset += records.length;
  }
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
