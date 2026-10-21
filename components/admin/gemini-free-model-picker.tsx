"use client";

import { useEffect, useMemo, useState } from "react";
import { GEMINI_FREE_TEXT_MODELS, type GeminiTextTask } from "@/lib/ai/free-models";

type CatalogItem = (typeof GEMINI_FREE_TEXT_MODELS)[number] & { available?: boolean };
type Catalog = { models: CatalogItem[]; verified: boolean; message?: string };
let cache: Catalog | null = null;

export function GeminiFreeModelPicker({ task, value, onChange, label }: {
  task: GeminiTextTask; value: string; onChange: (value: string) => void; label: string;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(cache);
  const [error, setError] = useState("");
  useEffect(() => {
    if (cache) { setCatalog(cache); return; }
    let active = true;
    void fetch("/api/admin/news-agent/models", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível consultar os modelos habilitados na chave.");
        return await response.json() as Catalog;
      })
      .then((result) => { cache = result; if (active) setCatalog(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Catálogo indisponível."); });
    return () => { active = false; };
  }, []);

  const models = useMemo(() =>
    (catalog?.models || GEMINI_FREE_TEXT_MODELS).filter((item) => item.tasks.includes(task)),
  [catalog, task]);

  return <label className="block space-y-1.5 text-sm">
    <span className="font-medium">{label}</span>
    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value}
      onChange={(event) => onChange(event.target.value)}>
      <option value="auto">Automático · recomendado</option>
      {models.map((model) => <option key={model.id} value={model.id}
        disabled={Boolean(catalog?.verified && !model.available)}>
        {model.label}{model.legacy ? " · acesso restrito" : ""}
        {catalog?.verified && !model.available ? " · não listado para esta chave" : ""}
      </option>)}
    </select>
    <span className="block text-xs leading-5 text-muted-foreground">
      {error || (catalog?.verified
        ? "Somente modelos de texto cadastrados com Free Tier e listados para esta chave. Disponibilidade não confirma cota nem gratuidade em projeto faturado."
        : "Verificando disponibilidade dos modelos. A opção automática usa a configuração atual.")}
    </span>
  </label>;
}
