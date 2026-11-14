import { duplexEditorial } from "@/lib/duplex-print/catalog";
import { businessIdeasEditorial, businessIdeasSlug } from "@/lib/business-ideas-editorial";
import { brandEditorial, brandSlug } from "@/lib/brand-plan-editorial";
import { connectEditorial } from "@/lib/kivai-connect/content";
import { postCreatorEditorial } from "@/lib/post-creator/editorial";
import { pdfParaExcelEditorialOverride } from "@/lib/pdf-para-excel-editorial-override";
import { pdfParaHtmlEditorialOverride } from "@/lib/pdf-para-html-editorial-override";
import { archiveToolEditorialContent } from "@/lib/archive-tool-editorial-content";
import { removedorMetadadosEditorialContent } from "@/lib/removedor-metadados-editorial-content";
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
  overview: readonly string[];
  useCases: ReadonlyArray<{ title: string; description: string }>;
  steps: readonly string[];
  specifications: ReadonlyArray<{ label: string; value: string }>;
  privacy: string;
  limitations: readonly string[];
  faqs: ReadonlyArray<{ question: string; answer: string }>;
  related: ReadonlyArray<{ href: string; label: string }>;
};

const sources: Array<Record<string, EditorialSource>> = [
  { [businessIdeasSlug]: businessIdeasEditorial },
  { [brandSlug]: brandEditorial },
  { "criador-de-posts-com-ia": postCreatorEditorial },
  { "pdf-para-excel": pdfParaExcelEditorialOverride, "pdf-para-html": pdfParaHtmlEditorialOverride },
  archiveToolEditorialContent,
  { "removedor-de-metadados": removedorMetadadosEditorialContent, "removedor-de-metadados-e-rotulos-de-ia": removedorMetadadosEditorialContent },
  { "montar-video-camera-dupla": {
    overview: ["Combine duas gravações em um único vídeo para mostrar a cena e uma reação, entrevista ou segunda perspectiva. A montagem acontece no navegador, sem enviar os arquivos ao Kivai."],
    useCases: [
      { title: "Vídeo de reação", description: "Mostre a gravação principal e sua reação em uma janela menor." },
      { title: "Duas perspectivas", description: "Exiba dois ângulos lado a lado em uma composição única." },
    ],
    steps: ["Envie o vídeo principal e o vídeo que ficará sobreposto ou ao lado.", "Escolha imagem sobreposta ou tela dividida.", "Na imagem sobreposta, escolha o canto e ajuste o tamanho da janela.", "Confira a prévia sincronizada e clique em Gerar vídeo.", "Reproduza o resultado e baixe o arquivo no formato indicado pela ferramenta."],
    specifications: [
      { label: "Composições", value: "Imagem sobreposta em quatro posições ou tela dividida horizontal/vertical." },
      { label: "Prévia", value: "Os dois vídeos são reproduzidos em conjunto para conferir a composição antes de exportar." },
      { label: "Saída", value: "Um arquivo WebM ou MP4, conforme os formatos de gravação compatíveis com o navegador." },
    ],
    privacy: "Os arquivos são lidos e processados localmente no navegador. Eles não são enviados ao Kivai. Mantenha a página aberta até concluir e baixar o vídeo.",
    limitations: ["Use vídeos em formatos que o navegador consiga reproduzir; a exportação pode ser WebM ou MP4 conforme o navegador.", "O vídeo final usa a duração do vídeo principal; o segundo vídeo para quando sua reprodução termina.", "Exportar exige memória e processamento do dispositivo. Arquivos longos ou grandes podem demorar ou exceder os recursos do celular."],
    faqs: [
      { question: "Preciso gravar os dois vídeos ao mesmo tempo?", answer: "Não. Envie duas gravações existentes para montar a composição." },
      { question: "Quais layouts estão disponíveis?", answer: "Você pode colocar um vídeo sobre o outro em um canto ou dividir a tela horizontal ou verticalmente." },
      { question: "Meus vídeos são enviados para um servidor?", answer: "Não. A prévia e a composição são processadas no seu navegador." },
      { question: "Em qual formato posso baixar?", answer: "A ferramenta escolhe WebM ou MP4 de acordo com os formatos de gravação disponíveis no navegador." },
    ],
    related: [
      { href: "/ferramentas/recortar-video", label: "Recortar vídeo" },
      { href: "/ferramentas/redimensionar-video", label: "Redimensionar vídeo" },
      { href: "/ferramentas/compressor-de-videos", label: "Compressor de vídeos" },
    ],
  } },
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

function paragraphs(items: readonly string[]) {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function list(items: readonly string[], ordered = false) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

export function inferToolMode(slug: string): ToolImplementationMode {
  if (slug === "kivai-connect") return "auto";
  if (slug === "criador-de-posts-com-ia" || slug === businessIdeasSlug || slug === brandSlug) return "server";
  if (serverTools.has(slug)) return "server";
  if (informationalTools.has(slug)) return "informational";
  return "browser";
}

export function getExistingToolEditorialHtml(slug: string) {
  if (slug === "criador-de-curriculo-online") return "<h2>Como fazer currículo para uma vaga</h2><p>Comece com o cargo desejado e um contato atualizado. No resumo, descreva o que você sabe fazer e onde aplicou esse conhecimento. Em vez de escrever “responsável por atendimento”, por exemplo, explique “Atendia clientes por telefone e registrava solicitações no sistema”, se isso fizer parte da sua experiência.</p><p>Liste as experiências da mais recente para a mais antiga. Para o primeiro emprego, destaque sua formação, projetos e trabalho voluntário. Revise os dados e baixe a versão em PDF. O documento usa uma coluna e texto selecionável para facilitar a leitura por sistemas de triagem (ATS).</p>";
  if (slug === "kivai-connect") return connectEditorial;
  if (slug === "imprimir-frente-e-verso") return duplexEditorial;
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

