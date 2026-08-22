import { isPostIndexable } from "@/lib/blog/indexing";
import { listAllPosts } from "@/lib/blog/repository";

export async function GET() {
  try {
    const posts = (await listAllPosts()).filter(
      (post) => post.status === "published" && isPostIndexable(post)
    );

    const searchPosts = posts.slice(0, 150).map((post) => ({
      id: `article:${post.slug}`,
      type: "article" as const,
      title: post.title,
      description: post.excerpt,
      href: `/blog/${post.slug}`,
      category: post.category?.name || "Blog",
      keywords: [
        post.title,
        post.excerpt,
        post.category?.name || "",
        ...post.tags.map((tag) => tag.name),
      ].filter(Boolean),
    }));

    return Response.json(
      { posts: searchPosts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return Response.json(
      { posts: [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }
}
