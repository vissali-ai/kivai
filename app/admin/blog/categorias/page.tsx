import { CategoryManager } from "@/components/admin/category-manager";
import { listCategories } from "@/lib/blog/repository";

export default async function CategoriesPage() {
  return <main><header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Organização</p><h1 className="mt-1 text-3xl font-semibold">Categorias</h1><p className="mt-2 text-sm text-muted-foreground">Organize as matérias em seções editoriais.</p></header><CategoryManager categories={await listCategories()} /></main>;
}
