import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Páginas HTML administrativas usam meta robots noindex.
        // A API administrativa continua bloqueada para crawlers.
        disallow: ["/api/admin/"],
      },
    ],

    sitemap: "https://www.kivai.com.br/sitemap.xml",

    host: "https://www.kivai.com.br",
  };
}
