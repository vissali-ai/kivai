"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
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

  return <div className="flex flex-wrap items-center justify-end gap-3">
    {message ? <p className="max-w-md text-right text-xs leading-5 text-muted-foreground" aria-live="polite">{message}</p> : null}
    <Button size="sm" disabled={!canRun || running} onClick={run}><Play />{running ? "Coletando..." : "Executar coleta agora"}</Button>
  </div>;
}
