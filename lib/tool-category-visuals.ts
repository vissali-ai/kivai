/**
 * Acentos discretos de categoria na navegação pública.
 * A identificação de cada categoria continua sendo feita por texto e ícone.
 */
export const toolCategoryAccentClass: Record<string, string> = {
  imagens: "border-l-primary/50",
  pdf: "border-l-primary/50",
  calculadoras: "border-l-primary/50",
  texto: "border-l-primary/50",
  social: "border-l-primary/50",
  video: "border-l-primary/50",
  audio: "border-l-primary/50",
  empresas: "border-l-primary/50",
  trafego: "border-l-primary/50",
  arquivos: "border-l-primary/50",
};

export function getToolCategoryAccentClass(slug: string) {
  return toolCategoryAccentClass[slug] ?? "border-l-primary/50";
}
