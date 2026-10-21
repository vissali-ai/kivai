/** Modelos de geração de TEXTO com modalidade Free Tier no Google Gemini API.
 * Lista conservadora: não inclui geração de imagens, voz, modelos pagos ou versões descontinuadas.
 * "Free Tier" não é garantia de acesso com qualquer chave nem de custo zero em projeto pago.
 * Fonte: https://ai.google.dev/gemini-api/docs/pricing
 */
export type GeminiTextTask = "search" | "url" | "text";
export type GeminiFreeTextModel = {
  id: string; label: string; legacy?: boolean;
  tasks: readonly GeminiTextTask[];
};
export const GEMINI_FREE_TEXT_MODELS: readonly GeminiFreeTextModel[] = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", tasks: ["url", "text"] },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", tasks: ["url", "text"] },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", tasks: ["url", "text"] },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", tasks: ["url", "text"] },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", tasks: ["url", "text"] },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", legacy: true, tasks: ["url", "text"] },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", legacy: true, tasks: ["search", "url", "text"] },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", legacy: true, tasks: ["search", "url", "text"] },
] as const;

// Pesquisa integrada ao Google Search é gratuita no 2.5 Flash / Lite
// para projetos elegíveis. Grounding no 3.x não está no Free Tier da API.
export const GEMINI_DEFAULT_TEXT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"] as const;
export const GEMINI_DEFAULT_SEARCH_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;

export function geminiCandidates(task: GeminiTextTask, preferred?: unknown): string[] {
  if (preferred !== undefined && preferred !== null && preferred !== "" && preferred !== "auto") {
    if (typeof preferred !== "string" ||
      !GEMINI_FREE_TEXT_MODELS.some((item) => item.id === preferred && item.tasks.includes(task))) {
      throw new Error("Modelo Gemini incompatível com esta função ou não incluído no catálogo gratuito do Kivai.");
    }
    return [preferred];
  }
  return task === "search" ? [...GEMINI_DEFAULT_SEARCH_MODELS] : [...GEMINI_DEFAULT_TEXT_MODELS];
}
