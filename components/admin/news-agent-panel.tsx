"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewsAgentResult } from "@/lib/news-agent/types";

export function NewsAgentPanel({ canRun }: { canRun: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setRunning(true);
    setMessage("Consultando RSS, sitemaps e páginas editoriais para coletar pautas relevantes...");
    try {
      const response = await fetch("/api/admin/news-agent/run", { method: "POST" });
      const data = await response.json() as NewsAgentResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível executar o agente.");
      setMessage(`${data.draftsCreated} pauta(s) coletada(s), ${data.itemsSkipped} item(ns) ignorado(s).`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao executar o agente.");
    } finally {
      setRunning(false);
    }
  }

  return <div className="border border-primary/30 bg-primary/10 p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-2xl gap-3"><Bot className="mt-0.5 size-5 shrink-0 text-primary" /><div><h2 className="font-semibold">Executar coleta agora</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">O agente consulta RSS, sitemaps e páginas editoriais, filtra assuntos relacionados ao Kivai e cria até 15 pautas. Ele não escreve nem publica matérias. Ao publicar uma versão reescrita, a pauta é convertida em uma matéria editorial manual, sem marcadores do agente.</p></div></div>
      <Button disabled={!canRun || running} onClick={run}><Play />{running ? "Executando..." : "Buscar notícias"}</Button>
    </div>
    {message ? <p className="mt-4 border-t border-primary/20 pt-3 text-sm">{message}</p> : null}
  </div>;
}
