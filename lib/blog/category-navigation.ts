import type { Category } from "@/lib/blog/types";

export const defaultBlogCategories = [
  { name: "Notícias", slug: "noticias" },
  { name: "Inteligência Artificial", slug: "inteligencia-artificial" },
  { name: "Tecnologia", slug: "tecnologia" },
  { name: "Marketing", slug: "marketing" },
  { name: "E-commerce", slug: "e-commerce" },
  { name: "Guia de Ferramentas", slug: "guia-de-ferramentas" },
];

export function buildCategoryNavigation(categories: Category[]) {
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  return [
    ...defaultBlogCategories.map((category) => categoryBySlug.get(category.slug) ?? category),
    ...categories.filter((category) => !defaultBlogCategories.some((item) => item.slug === category.slug)),
  ];
}
