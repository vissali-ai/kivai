import { BlogCategoryNavigation } from "@/components/blog/category-navigation";
import { listCategories } from "@/lib/blog/repository";

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const categories = await listCategories();
  return <div className="flex w-full flex-1 flex-col pt-16">
    <BlogCategoryNavigation categories={categories} />
    {children}
  </div>;
}
