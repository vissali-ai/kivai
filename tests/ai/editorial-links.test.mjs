import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const source = readFileSync(fileURLToPath(new URL("../../lib/news-agent/editorial-links.ts", import.meta.url)), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tech = {
  id: "tech", name: "Portal Tecnologia", feedUrl: "https://tecnoblog.net/feed/",
  siteUrl: "https://tecnoblog.net", defaultCategorySlug: "tecnologia",
  kind: "rss", enabled: true,
};
const marketing = {
  id: "marketing", name: "Portal Marketing", feedUrl: "https://propmark.com.br/feed/",
  siteUrl: "https://propmark.com.br", defaultCategorySlug: "marketing",
  kind: "rss", enabled: true,
};
const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
const articles = {
  tech: [
    { title: "Google anuncia novas tecnologias para desenvolvedores",
      excerpt: "Mudanças relevantes para a indústria de tecnologia.", publishedAt: hourAgo, url: "https://tecnoblog.net/noticias/google-tecnologia/" },
    { title: "Lançamento antigo de tecnologia", excerpt: "Notícia antiga.",
      publishedAt: tenDaysAgo, url: "https://tecnoblog.net/noticias/antiga/" },
    { title: "Artigo de origem não segura", excerpt: "URL insegura.",
      publishedAt: hourAgo, url: "http://tecnoblog.net/artigos/inseguro/" },
  ],
  marketing: [
    { title: "Google Ads libera nova função para anúncios", excerpt: "Mudanças no Google Ads.",
      publishedAt: hourAgo, url: "https://propmark.com.br/google-ads-novidade/" },
  ],
};
function makeCandidate(sourceItem, fields) {
  return { sourceId: sourceItem.id, sourceName: sourceItem.name,
    categorySlug: sourceItem.defaultCategorySlug, tags: [], guid: fields.url,
    contentHtml: "", ...fields };
}
const moduleData = { exports: {} };
runInNewContext(output, {
  module: moduleData, exports: moduleData.exports,
  require(name) {
    if (name === "server-only") return {};
    if (name === "@/lib/news-agent/repository") return { listNewsSources: async () => [tech, marketing] };
    if (name === "@/lib/news-agent/source-collector") return {
      fetchNewsSource: async (sourceItem) =>
        (articles[sourceItem.id] || []).map((item) => makeCandidate(sourceItem, item)),
    };
    if (name === "@/lib/news-agent/candidate-ranking") return {
      deduplicateNewsTopics: (items) =>
        items.filter((item, index) => items.findIndex((other) => other.title === item.title) === index),
    };
    throw new Error("Módulo não esperado: " + name);
  },
  URL, Date, Set, Promise, console,
});
const { researchEditorialLinks } = moduleData.exports;
const topic = { id: "tech", slug: "tecnologia", name: "Tecnologia",
  searchTerms: "inovação, softwares e lançamentos", categorySlug: "tecnologia", enabled: true };

test("Pesquisa de 24h devolve URLs HTTPS reais e não confunde link com reportagem gerada", async () => {
  const data = await researchEditorialLinks({ topics: [topic], freeQuery: "", period: "24h", region: "brasil" });
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].sourceUrl, "https://tecnoblog.net/noticias/google-tecnologia/");
  assert.equal(data.items[0].sourceName, "Portal Tecnologia");
  assert.equal(data.model, "fontes-rss");
});

test("Busca personalizada encontra notícia de assunto específico, sem exigir Gemini", async () => {
  const data = await researchEditorialLinks({ topics: [], freeQuery: "Google Ads", period: "7d", region: "brasil" });
  assert.ok(data.items.some((item) => item.sourceUrl === "https://propmark.com.br/google-ads-novidade/"));
  assert.ok(data.items.every((item) => item.sourceUrl.startsWith("https://")));
});

test("Período de 30 dias inclui notícia de 10 dias, mas 24h não", async () => {
  const data = await researchEditorialLinks({ topics: [topic], freeQuery: "", period: "30d", region: "ambos" });
  assert.ok(data.items.some((item) => item.sourceUrl === "https://tecnoblog.net/noticias/antiga/"));
});

test("Nenhum resultado retorna orientação útil em vez de erro de modelo", async () => {
  const data = await researchEditorialLinks({ topics: [], freeQuery: "termoque-nao-existe", period: "24h", region: "brasil" });
  assert.equal(data.items.length, 0);
  assert.match(data.notice, /Nenhuma matéria encontrada/);
});
