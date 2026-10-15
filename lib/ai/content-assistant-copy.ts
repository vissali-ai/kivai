import type { SiteOriginalField } from "@/lib/site-cms/types";

export type AssistantCopy = { title: string; description: string; tutorialUrl: string };
export const assistantSlugs = { planner: "planejador-de-conteudo-social-media", calendar: "calendario-editorial-redes-sociais" } as const;
export function assistantFields(slug: string): SiteOriginalField[] {
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
