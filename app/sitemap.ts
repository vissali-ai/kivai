import type { MetadataRoute } from "next";
import { isToolIndexable, tools } from "@/lib/tools";
import { listCategories, listPublishedPosts } from "@/lib/blog/repository";

const baseUrl = "https://www.kivai.com.br";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, categories] = await Promise.all([listPublishedPosts(), listCategories()]);
  const pages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/ferramentas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...[
      "imagens",
      "pdfs",
      "calculadoras",
      "texto",
      "social-media",
      "videos",
    ].map((slug) => ({
      url: `${baseUrl}/ferramentas/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // Páginas principais
    {
      url: `${baseUrl}/servicos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Serviços
    {
      url: `${baseUrl}/servicos/gestao-de-trafego`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/servicos/divulgacao-artistas`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/servicos/criacao-de-landing-pages`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // Institucional
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/metodologia`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: blogPosts[0]?.updatedAt ? new Date(blogPosts[0].updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.filter((category) => blogPosts.some((post) => post.categoryId === category.id)).map((category) => ({
      url: `${baseUrl}/blog/categoria/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  const toolPages: MetadataRoute.Sitemap = tools
    .filter((tool) => isToolIndexable(tool.slug))
    .map((tool) => ({
      url: `${baseUrl}/ferramentas/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: tool.featured ? 0.9 : 0.8,
    }));

  return [...pages, ...toolPages];
}
