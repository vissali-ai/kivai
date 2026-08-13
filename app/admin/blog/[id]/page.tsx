import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getPostById, listCategories } from "@/lib/blog/repository";
import { tools } from "@/lib/tools";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [post, categories] = await Promise.all([getPostById((await params).id), listCategories()]);
  if (!post) notFound();
  return <PostEditor post={post} categories={categories} tools={tools.filter((tool) => tool.available).map(({ slug, name }) => ({ slug, name }))} />;
}
