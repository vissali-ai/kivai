/**
 * Acentos discretos de categoria na navegação pública.
 * A identificação de cada categoria continua sendo feita por texto e ícone.
 */
export const toolCategoryAccentClass: Record<string, string> = {
  imagens: "border-l-sky-500/70",
  pdf: "border-l-rose-500/70",
  calculadoras: "border-l-emerald-500/70",
  texto: "border-l-amber-500/70",
  social: "border-l-pink-500/70",
  video: "border-l-cyan-500/70",
  audio: "border-l-orange-500/70",
  empresas: "border-l-teal-500/70",
  trafego: "border-l-indigo-500/70",
  arquivos: "border-l-slate-400/70",
};

export function getToolCategoryAccentClass(slug: string) {
  return toolCategoryAccentClass[slug] ?? "border-l-primary/50";
}
