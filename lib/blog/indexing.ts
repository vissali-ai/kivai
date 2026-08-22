import type { Post } from "@/lib/blog/types";

/**
 * Apenas conteúdo editorial manual participa da descoberta pública e da
 * indexação. Matérias preparadas pelo agente RSS permanecem acessíveis por URL
 * para preservar links existentes, mas não entram no sitemap, nas listagens ou
 * na busca até receberem uma decisão editorial explícita no CMS.
 */
export function isPostIndexable(post: Pick<Post, "origin" | "reviewStatus">) {
  return post.origin === "manual" || post.reviewStatus === "approved";
}

export function filterIndexablePosts<T extends Pick<Post, "origin" | "reviewStatus">>(posts: T[]) {
  return posts.filter(isPostIndexable);
}
