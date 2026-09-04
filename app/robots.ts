import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host === "trafego.kivai.com.br") {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
      sitemap: "https://trafego.kivai.com.br/sitemap.xml",
      host: "trafego.kivai.com.br",
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/admin/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
