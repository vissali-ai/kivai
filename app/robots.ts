import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],

    sitemap: "https://www.kivai.com.br/sitemap.xml",

    host: "https://www.kivai.com.br",
  };
}
