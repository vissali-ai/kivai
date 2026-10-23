export type ContentEmailFlow = "new_post" | "blog_digest" | "new_tool";

const SUBJECT_PREFIX: Record<ContentEmailFlow, string> = {
  new_post: "Nova publicação no blog do Kivai",
  blog_digest: "Novidades no blog do Kivai",
  new_tool: "Nova ferramenta no Kivai",
};

/** Even legacy Admin subjects without {{titulo}} must feature the published content. */
export function contentEmailSubject(flow: ContentEmailFlow, templateSubject: string, title: string) {
  const headline = title.replace(/\s+/g, " ").trim();
  const custom = templateSubject.replaceAll("{{titulo}}", headline).trim();
  return custom && headline && custom.includes(headline) ? custom : SUBJECT_PREFIX[flow] + ": " + headline;
}

/** Avoid repeating the same editorial headline as H1 and as an H2 in default templates. */
export function withoutRepeatedTitleHeading(message: string, title: string) {
  let removed = false;
  return message.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (heading, inner: string) => {
    if (removed || inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() !== title.trim()) return heading;
    removed = true;
    return "";
  });
}

/** Existing editable digest template says "três publicações"; make it correct for a two-post batch. */
export function adjustDigestCount(message: string, count: number) {
  return message.replace(/três publicações recentes/gi, String(count) + " publicações recentes");
}

/** Editorial home-page featured order wins; newest post is the fallback. */
export function pickFeaturedBlogPosts<T extends { featured?: boolean | null; featured_order?: number | null; published_at?: string | null }>(posts: readonly T[], limit = 3) {
  return [...posts].sort((left, right) =>
    Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
    (left.featured ? (left.featured_order ?? 99) : 99) - (right.featured ? (right.featured_order ?? 99) : 99) ||
    Date.parse(right.published_at || "") - Date.parse(left.published_at || "") || 0,
  ).slice(0, limit);
}
