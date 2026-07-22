import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";

const baseUrl = "https://kivai.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    {
      url: `${baseUrl}/servicos/gestao-de-trafego`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = tools
    .filter((tool) => tool.index !== false)
    .map((tool) => ({
      url: `${baseUrl}/ferramentas/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: tool.featured ? 0.9 : 0.8,
    }));

  return [...pages, ...toolPages];
}