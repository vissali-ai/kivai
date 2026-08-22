import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const routesRoot = path.join(root, "app", "ferramentas");
const catalogPath = path.join(root, "lib", "tools.ts");
const archiveCatalogPath = path.join(root, "lib", "archive-search-items.ts");
const standaloneCatalogPaths = [
  path.join(root, "lib", "removedor-metadados-tool.ts"),
];
const hubRoutes = new Set(["imagens", "pdfs", "calculadoras", "texto", "social-media", "videos", "arquivos"]);
const errors = [];

const catalogSource = await readFile(catalogPath, "utf8");
const archiveCatalogSource = await readFile(archiveCatalogPath, "utf8");
const toolsSource = catalogSource.slice(catalogSource.indexOf("export const tools: Tool[] = ["));
const toolBlocks = [...toolsSource.matchAll(/\{\s*slug:\s*"([^"]+)"[\s\S]*?\n\s{2}\},/g)];
const availableSlugs = toolBlocks
  .filter((match) => /\bavailable:\s*true\b/.test(match[0]))
  .map((match) => match[1]);
const archiveSlugs = [...archiveCatalogSource.matchAll(/^\s*slug:\s*"([^"]+)",?$/gm)].map((match) => match[1]);
availableSlugs.push(...archiveSlugs);
const indexableSource = catalogSource.slice(
  catalogSource.indexOf("export const INDEXABLE_TOOL_SLUGS = ["),
  catalogSource.indexOf("] as const;", catalogSource.indexOf("export const INDEXABLE_TOOL_SLUGS = [")),
);
const indexableSlugs = [...indexableSource.matchAll(/^\s*"([^"]+)",?$/gm)].map((match) => match[1]);
indexableSlugs.push(...archiveSlugs);

for (const standaloneCatalogPath of standaloneCatalogPaths) {
  const standaloneSource = await readFile(standaloneCatalogPath, "utf8");
  const slug = standaloneSource.match(/^\s*slug:\s*"([^"]+)",?$/m)?.[1];
  if (!slug) {
    errors.push(`Catálogo independente sem slug: ${path.relative(root, standaloneCatalogPath)}`);
    continue;
  }
  availableSlugs.push(slug);
  indexableSlugs.push(slug);
}

const routeEntries = await readdir(routesRoot, { withFileTypes: true });
const routeSlugs = [];
const routeSources = new Map();
for (const entry of routeEntries) {
  if (!entry.isDirectory() || entry.name.startsWith("[") || hubRoutes.has(entry.name)) continue;
  const pagePath = path.join(routesRoot, entry.name, "page.tsx");
  try {
    const source = await readFile(pagePath, "utf8");
    routeSlugs.push(entry.name);
    routeSources.set(entry.name, source);
  } catch {
    // Diretórios auxiliares sem page.tsx não representam uma ferramenta.
  }
}

const duplicates = (items) => [...new Set(items.filter((item, index) => items.indexOf(item) !== index))];
for (const slug of duplicates(availableSlugs)) errors.push(`Slug duplicado no catálogo: ${slug}`);
for (const slug of duplicates(indexableSlugs)) errors.push(`Slug duplicado na lista de indexação: ${slug}`);
for (const slug of availableSlugs.filter((slug) => !routeSlugs.includes(slug))) errors.push(`Ferramenta disponível sem rota: ${slug}`);
for (const slug of routeSlugs.filter((slug) => !availableSlugs.includes(slug))) errors.push(`Rota de ferramenta fora do catálogo disponível: ${slug}`);
for (const slug of availableSlugs.filter((slug) => !indexableSlugs.includes(slug))) errors.push(`Ferramenta disponível ausente da indexação: ${slug}`);
for (const slug of indexableSlugs.filter((slug) => !availableSlugs.includes(slug))) errors.push(`Slug indexável sem ferramenta disponível: ${slug}`);

for (const [slug, source] of routeSources) {
  if (!/export\s+(?:const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)/.test(source)) {
    errors.push(`Rota sem metadata: ${slug}`);
  }
  if (source.includes("<main") && /(?:Image|Pdf)ToolEditorial/.test(source)) {
    errors.push(`Possível landmark <main> duplicado: ${slug}`);
  }
  const unsafeJsonLd = source.split("\n").some((line) =>
    line.includes("dangerouslySetInnerHTML") &&
    line.includes("JSON.stringify") &&
    !line.includes('.replace(/</g, "\\\\u003c")') &&
    !line.includes('.replace(/</g,"\\\\u003c")'),
  );
  if (unsafeJsonLd) {
    errors.push(`JSON-LD sem escape de '<': ${slug}`);
  }

  for (const match of source.matchAll(/(?:href|url):?\s*=?(?:\{|)\s*["'`]\/ferramentas\/([a-z0-9-]+)/g)) {
    const target = match[1];
    if (!availableSlugs.includes(target) && !hubRoutes.has(target)) {
      errors.push(`Link interno inválido em ${slug}: ${target}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Auditoria das ferramentas falhou (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Auditoria concluída: ${availableSlugs.length} ferramentas, ${routeSlugs.length} rotas e ${indexableSlugs.length} URLs indexáveis coerentes.`);
}
