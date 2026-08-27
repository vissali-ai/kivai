import { notFound } from "next/navigation";
import { BlogPublicationControls } from "@/components/admin/blog-publication-controls";
import { PostEditor } from "@/components/admin/post-editor";
import { getBlogPublicationControlsById } from "@/lib/blog/publication-controls";
import { getPostById, listCategories } from "@/lib/blog/repository";
import { tools } from "@/lib/tools";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const [post, categories, publicationControls] = await Promise.all([
    getPostById(id),
    listCategories(),
    getBlogPublicationControlsById(id),
  ]);
  if (!post) notFound();
  return (
    <>
      <BlogPublicationControls postId={post.id} published={post.status === "published"} initialControls={publicationControls} />
      <PostEditor post={post} categories={categories} tools={tools.filter((tool) => tool.available).map(({ slug, name }) => ({ slug, name }))} />
    </>
  );
}
