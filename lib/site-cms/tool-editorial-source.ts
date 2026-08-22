import { generalToolEditorialContent } from "@/lib/general-tool-editorial-content";
import { imageToolEditorialContent } from "@/lib/image-tool-editorial-content";
import { pdfOfficeToolEditorialContent } from "@/lib/pdf-office-tool-editorial-content";
import { pdfSpecialToolEditorialContent } from "@/lib/pdf-special-tool-editorial-content";
import { pdfToolEditorialContent } from "@/lib/pdf-tool-editorial-content";
import { socialAdvancedEditorialContent } from "@/lib/social-tool-editorial-content";
import { videoLocalToolEditorialContent } from "@/lib/video-local-tool-editorial-content";
import { videoServerToolEditorialContent } from "@/lib/video-server-tool-editorial-content";
import type { ToolImplementationMode } from "@/lib/site-cms/types";

type EditorialSource = {
  overview: string[];
  useCases: Array<{ title: string; description: string }>;
  steps: string[];
  specifications: Array<{ label: string; value: string }>;
  privacy: string;
  limitations: string[];
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string }>;
};

const sources: Array<Record<string, EditorialSource>> = [
  generalToolEditorialContent,
  imageToolEditorialContent,
  pdfOfficeToolEditorialContent,
  pdfSpecialToolEditorialContent,
  pdfToolEditorialContent,
  socialAdvancedEditorialContent,
  videoLocalToolEditorialContent,
  videoServerToolEditorialContent,
];

const serverTools = new Set(Object.keys(videoServerToolEditorialContent));
const informationalTools = new Set([
  "radar-de-tendencias",
  "calendario-editorial-redes-sociais",
  "planejador-de-conteudo-social-media",
  "preview-de-post-redes-sociais",
  "gerador-de-relatorio-social-media",
]);

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function paragraphs(items: string[]) {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function list(items: string[], ordered = false) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

export function inferToolMode(slug: string): ToolImplementationMode {
  if (serverTools.has(slug)) return "server";
  if (informationalTools.has(slug)) return "informational";
  return "browser";
}

export function getExistingToolEditorialHtml(slug: string) {
  const content = sources.find((source) => source[slug])?.[slug];
  if (!content) return "";
  return [
    "<h2>Sobre esta ferramenta</h2>", paragraphs(content.overview),
    "<h2>Como usar</h2>", list(content.steps, true),
    "<h2>Quando utilizar</h2>", content.useCases.map((item) => `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>`).join(""),
    "<h2>Formatos, controles e resultado</h2>", content.specifications.map((item) => `<h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.value)}</p>`).join(""),
    "<h2>Privacidade e processamento</h2>", `<p>${escapeHtml(content.privacy)}</p>`,
    "<h2>Limitações importantes</h2>", list(content.limitations),
    "<h2>Perguntas frequentes</h2>", content.faqs.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join(""),
    "<h2>Ferramentas relacionadas</h2>", `<ul>${content.related.map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`).join("")}</ul>`,
  ].join("");
}
