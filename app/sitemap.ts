import type { MetadataRoute } from "next";
import { archiveSearchItems } from "@/lib/archive-search-items";
import { listCategories, listPublishedPosts } from "@/lib/blog/repository";
import { removedorMetadadosTool } from "@/lib/removedor-metadados-tool";
import { SITE_URL } from "@/lib/seo";
import { isToolIndexable, tools } from "@/lib/tools";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, categories] = await Promise.all([
    listPublishedPosts(),
    listCategories(),
  ]);

  const pages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/ferramentas`,
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
      "arquivos",
    ].map((slug) => ({
      url: `${SITE_URL}/ferramentas/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...archiveSearchItems.map((tool) => ({
      url: `${SITE_URL}/ferramentas/${tool.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}${removedorMetadadosTool.href}`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/servicos`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/servicos/gestao-de-trafego`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/servicos/social-media`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/servicos/divulgacao-artistas`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/servicos/criacao-de-landing-pages`,
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
      url: `${SITE_URL}/servicos/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/sobre`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/metodologia`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/ajuda`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/seguranca`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/termos`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contato`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/blog`,
      ...(blogPosts[0]?.updatedAt
        ? { lastModified: new Date(blogPosts[0].updatedAt) }
        : {}),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.flatMap((category) => {
      const categoryPosts = blogPosts.filter(
        (post) => post.categoryId === category.id
      );

      if (categoryPosts.length === 0) return [];

      const latestUpdate = categoryPosts.reduce((latest, post) =>
        new Date(post.updatedAt) > new Date(latest.updatedAt) ? post : latest
      );

      return [
        {
          url: `${SITE_URL}/blog/categoria/${category.slug}`,
          lastModified: new Date(latestUpdate.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        },
      ];
    }),
  ];

  const toolPages: MetadataRoute.Sitemap = tools
    .filter((tool) => isToolIndexable(tool.slug))
    .map((tool) => ({
      url: `${SITE_URL}/ferramentas/${tool.slug}`,
      changeFrequency: "weekly",
      priority: tool.featured ? 0.9 : 0.8,
    }));

  return [...pages, ...toolPages];
}
