import { PostEditor } from "@/components/admin/post-editor";
import { listCategories } from "@/lib/blog/repository";
import { tools } from "@/lib/tools";

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const params = await searchParams;
  const initialPublicationTarget = params.channel === "kivai_streaming" ? "kivai_streaming" : "kivai_blog";
  return <PostEditor initialPublicationTarget={initialPublicationTarget} categories={await listCategories()} tools={tools.filter((tool) => tool.available).map(({ slug, name }) => ({ slug, name }))} />;
}
