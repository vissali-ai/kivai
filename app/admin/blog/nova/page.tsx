import { PostEditor } from "@/components/admin/post-editor";
import { listCategories } from "@/lib/blog/repository";
import { tools } from "@/lib/tools";

export default async function NewPostPage() {
  return <PostEditor categories={await listCategories()} tools={tools.filter((tool) => tool.available).map(({ slug, name }) => ({ slug, name }))} />;
}
