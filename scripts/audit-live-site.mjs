import process from "node:process";

const baseUrl = (process.env.KIVAI_AUDIT_URL || "https://www.kivai.com.br").replace(/\/$/, "");
const concurrency = 8;
const failures = [];

async function request(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "KivaiSiteAudit/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  return { response, body: await response.text() };
}

async function mapConcurrent(items, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function extractAttribute(tag, name) {
  return tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))?.[1] || "";
}

const { response: sitemapResponse, body: sitemapXml } = await request(`${baseUrl}/sitemap.xml`);
if (!sitemapResponse.ok) failures.push(`Sitemap respondeu ${sitemapResponse.status}.`);

const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
const duplicateUrls = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index);
if (duplicateUrls.length) failures.push(`Sitemap contém URLs duplicadas: ${[...new Set(duplicateUrls)].join(", ")}`);

const pageResults = await mapConcurrent(sitemapUrls, async (url) => {
  try {
    const { response, body } = await request(url);
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const canonicalTag = body.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0] || "";
    const canonical = extractAttribute(canonicalTag, "href");
    const robotsTag = body.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0] || "";
    const robots = extractAttribute(robotsTag, "content");
    const h1Count = [...body.matchAll(/<h1\b/gi)].length;
    const links = [...body.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((match) => match[1]);

    if (!response.ok) failures.push(`${url} respondeu ${response.status}.`);
    if (!title) failures.push(`${url} está sem <title>.`);
    if (h1Count !== 1) failures.push(`${url} possui ${h1Count} elementos <h1>.`);
    if (!canonical) failures.push(`${url} está sem canonical.`);
    if (/noindex/i.test(robots)) failures.push(`${url} está com noindex apesar de constar no sitemap.`);

    return { url, links };
  } catch (error) {
    failures.push(`${url} falhou: ${error instanceof Error ? error.message : String(error)}.`);
    return { url, links: [] };
  }
});

const internalLinks = new Set();
for (const page of pageResults) {
  for (const href of page.links) {
    if (/^(?:mailto:|tel:|javascript:|#)/i.test(href)) continue;
    try {
      const url = new URL(href, page.url);
      if (url.origin !== new URL(baseUrl).origin) continue;
      url.hash = "";
      internalLinks.add(url.toString());
    } catch {
      failures.push(`Link inválido em ${page.url}: ${href}`);
    }
  }
}

await mapConcurrent([...internalLinks], async (url) => {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "KivaiSiteAudit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) failures.push(`Link interno ${url} respondeu ${response.status}.`);
  } catch (error) {
    failures.push(`Link interno ${url} falhou: ${error instanceof Error ? error.message : String(error)}.`);
  }
});

const { response: robotsResponse, body: robotsTxt } = await request(`${baseUrl}/robots.txt`);
if (!robotsResponse.ok) failures.push(`robots.txt respondeu ${robotsResponse.status}.`);
if (!robotsTxt.includes(`Sitemap: ${baseUrl}/sitemap.xml`)) failures.push("robots.txt não referencia o sitemap principal.");

const toolUrls = sitemapUrls.filter((url) => url.startsWith(`${baseUrl}/ferramentas/`));
const guideUrls = sitemapUrls.filter((url) => url.startsWith(`${baseUrl}/blog/como-usar-`));

console.log(`Auditoria pública: ${sitemapUrls.length} URLs no sitemap, ${toolUrls.length} páginas de ferramentas, ${guideUrls.length} guias e ${internalLinks.size} links internos únicos.`);

if (failures.length) {
  console.error(`Falhas encontradas (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Todas as URLs, metatags de indexação e ligações internas verificadas responderam corretamente.");
}
