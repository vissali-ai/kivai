import type { SiteOriginalField } from "@/lib/site-cms/types";

export type AssistantCopy = { title: string; description: string; tutorialUrl: string };
export const assistantSlugs = { planner: "planejador-de-conteudo-social-media", calendar: "calendario-editorial-redes-sociais" } as const;
const extraCopy: Record<string, [string, string]> = {
  "contador-de-caracteres-instagram": ["Melhore sua legenda com IA", "Revise, encurte ou crie variações da legenda. Confira a prévia antes de substituir seu texto."],
  "preview-de-post-redes-sociais": ["Revise seu post com IA", "Receba variações de legenda e, com uma imagem selecionada, sugestões de coerência e descrição acessível."],
  "radar-de-tendencias": ["Transforme uma notícia em ideias com IA", "Escolha uma notícia e informe seu segmento para receber pautas baseadas no trecho disponível, com a fonte preservada."],
  "pdf-para-excel": ["Extraia tabelas com IA", "Identifique tabelas de páginas difíceis, confira os dados e baixe uma planilha separada da conversão normal."],
  "pdf-para-word": ["Organize o documento com IA", "Organize o conteúdo das páginas selecionadas em títulos, parágrafos e listas. Revise antes de baixar o DOCX."],
  "pdf-para-html": ["Organize o HTML com IA", "Transforme o conteúdo das páginas selecionadas em uma estrutura simples de títulos, parágrafos e listas, com prévia."],
  "renomear-arquivos-em-lote": ["Sugira nomes com IA", "Descreva como organizar seus arquivos e revise os nomes sugeridos antes de aplicar à prévia e baixar o ZIP."],
};
export function assistantFields(slug: string): SiteOriginalField[] {
  if (extraCopy[slug]) return [
    {key:"ai-title",label:"IA: título do assistente",type:"text",value:extraCopy[slug][0]},
    {key:"ai-description",label:"IA: descrição do assistente",type:"textarea",value:extraCopy[slug][1]},
    {key:"ai-tutorial-url",label:"IA: link do tutorial",type:"url",value:""},
  ];
  if (!Object.values(assistantSlugs).some(value => value === slug)) return [];
  const calendar = slug === assistantSlugs.calendar;
  return [
    { key: "ai-title", label: "IA: título do assistente", type: "text", value: calendar ? "Crie uma sequência de publicações com IA" : "Transforme seu briefing em conteúdo com IA" },
    { key: "ai-description", label: "IA: descrição do assistente", type: "textarea", value: calendar ? "Receba até 7 pautas com legendas e chamadas para ação. Revise e escolha quais adicionar ao calendário." : "Preencha tema, público, objetivo e redes no formulário. Receba uma mensagem central, um gancho, tópicos de roteiro e uma chamada para ação." },
    { key: "ai-tutorial-url", label: "IA: link do tutorial", type: "url", value: "" },
  ];
}
export function withAssistantFields(slug: string, fields: SiteOriginalField[] = []) {
  return [...fields, ...assistantFields(slug).filter(field => !fields.some(existing => existing.key === field.key))];
}
export function assistantCopy(slug: string, fields: SiteOriginalField[] = []): AssistantCopy {
  const merged = withAssistantFields(slug, fields);
  const read = (key: string) => String(merged.find(field => field.key === key)?.value ?? "");
  return { title: read("ai-title"), description: read("ai-description"), tutorialUrl: read("ai-tutorial-url") };
}
