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
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/ferramentas`,
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
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // Páginas principais
    {
      url: `${baseUrl}/servicos`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Serviços
    {
      url: `${baseUrl}/servicos/gestao-de-trafego`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/servicos/social-media`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/servicos/divulgacao-artistas`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/servicos/criacao-de-landing-pages`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...[
      "automacao-de-processos",
      "presenca-local-no-google",
      "consultoria-para-e-commerce",
      "criacao-de-loja-virtual",
      "seo-local",
      "dashboards-e-relatorios",
      "sistemas-e-automacoes-personalizadas",
    ].map((slug) => ({
      url: `${baseUrl}/servicos/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    // Institucional
    {
      url: `${baseUrl}/sobre`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/metodologia`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/termos`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contato`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      ...(blogPosts[0]?.updatedAt ? { lastModified: new Date(blogPosts[0].updatedAt) } : {}),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.flatMap((category) => {
      const categoryPosts = blogPosts.filter((post) => post.categoryId === category.id);
      if (categoryPosts.length === 0) return [];

      const latestUpdate = categoryPosts.reduce((latest, post) =>
        new Date(post.updatedAt) > new Date(latest.updatedAt) ? post : latest,
      );

      return [{
        url: `${baseUrl}/blog/categoria/${category.slug}`,
        lastModified: new Date(latestUpdate.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }];
    }),
  ];

  const toolPages: MetadataRoute.Sitemap = tools
    .filter((tool) => isToolIndexable(tool.slug))
    .map((tool) => ({
      url: `${baseUrl}/ferramentas/${tool.slug}`,
      changeFrequency: "weekly",
      priority: tool.featured ? 0.9 : 0.8,
    }));

  return [...pages, ...toolPages];
}
