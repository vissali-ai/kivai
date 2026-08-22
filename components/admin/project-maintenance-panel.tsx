"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectMaintenanceSnapshot } from "@/lib/project-maintenance";

const LAST_LOCAL_MEASUREMENT = [
  { path: ".next", sizeBytes: 1_925_954_781, fileCount: 4_686, available: true },
  { path: ".next/dev", sizeBytes: 1_492_582_726, fileCount: 1_587, available: true },
  { path: ".next/cache", sizeBytes: 315_282_695, fileCount: 71, available: true },
  { path: "node_modules", sizeBytes: 1_201_560_350, fileCount: 59_142, available: true },
  { path: "backend/.venv", sizeBytes: 1_053_464_692, fileCount: 25_566, available: true },
  { path: ".git", sizeBytes: 278_584_967, fileCount: 123, available: true },
];

const LARGE_FILES_COMMAND = "Get-ChildItem -LiteralPath . -File -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Length -ge 100MB } | Sort-Object Length -Descending | Select-Object FullName, @{Name='TamanhoMB'; Expression={[math]::Round($_.Length / 1MB, 1)}}";

function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} MB`;
  return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB`;
}

export function ProjectMaintenancePanel() {
  const [snapshot, setSnapshot] = useState<ProjectMaintenanceSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const folders = snapshot?.folders ?? LAST_LOCAL_MEASUREMENT;

  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/maintenance/project", { method: "POST", cache: "no-store" });
      const data = await response.json() as ProjectMaintenanceSnapshot & { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar a auditoria.");
      setSnapshot(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar a auditoria.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(LARGE_FILES_COMMAND);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <Card>
    <CardHeader className="flex-row flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Wrench className="size-4 text-primary" />Código e arquivos do projeto</CardTitle><Button type="button" size="sm" variant="outline" onClick={refresh} disabled={busy}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Analisando..." : "Atualizar dados"}</Button></CardHeader>
    <CardContent>
      <p className="text-xs leading-5 text-muted-foreground">{snapshot ? snapshot.environment === "local" ? "Leitura atual do projeto no seu computador." : "Leitura do pacote disponível na implantação Vercel. Caches de desenvolvimento e arquivos do seu computador não ficam acessíveis na produção." : "Última medição local conhecida. Clique em Atualizar dados para medir o ambiente em que este painel está aberto."}</p>
      {snapshot?.deployment ? <div className="mt-3 grid gap-2 border border-white/10 p-3 text-xs sm:grid-cols-2"><p><span className="text-muted-foreground">Vercel:</span> {snapshot.deployment.environment}</p><p><span className="text-muted-foreground">Região:</span> {snapshot.deployment.region}</p><p className="truncate sm:col-span-2"><span className="text-muted-foreground">Commit:</span> {snapshot.deployment.commitSha.slice(0, 12)}</p></div> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{folders.map((folder) => <div key={folder.path} className="border border-white/10 bg-black/10 p-3"><p className="font-mono text-xs text-primary">{folder.path}</p><p className="mt-1 text-lg font-semibold">{folder.available ? formatSize(folder.sizeBytes) : "Não existe aqui"}</p><p className="text-[11px] text-muted-foreground">{folder.available ? `${folder.fileCount.toLocaleString("pt-BR")} arquivo(s)` : "Ausente neste ambiente"}</p></div>)}</div>
      {snapshot ? <div className="mt-4 border border-white/10 p-3 text-sm"><p><strong>Total encontrado:</strong> {formatSize(snapshot.totalSizeBytes)} em {snapshot.totalFileCount.toLocaleString("pt-BR")} arquivos.</p>{snapshot.truncated ? <p className="mt-1 text-xs text-amber-300">A leitura atingiu o limite de segurança; execute o comando local abaixo para uma varredura completa.</p> : null}{snapshot.largestFiles.length ? <div className="mt-3"><p className="text-xs font-medium">Arquivos acima de 100 MB</p>{snapshot.largestFiles.map((file) => <p key={file.path} className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{file.path} — {formatSize(file.sizeBytes)}</p>)}</div> : <p className="mt-1 text-xs text-emerald-300">Nenhum arquivo individual acima de 100 MB neste ambiente.</p>}</div> : null}
      {error ? <p className="mt-3 text-xs text-red-300" role="alert">{error}</p> : null}
      <div className="mt-5 border-t border-white/10 pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">Localizar arquivos grandes no PowerShell</p><Button type="button" size="sm" variant="ghost" onClick={copyCommand}>{copied ? <Check /> : <Copy />}{copied ? "Copiado" : "Copiar código"}</Button></div><code className="mt-2 block overflow-x-auto whitespace-pre-wrap break-all border border-white/10 bg-black/20 p-3 text-[11px] leading-5 text-primary">{LARGE_FILES_COMMAND}</code><p className="mt-2 text-xs leading-5 text-muted-foreground">O comando apenas lista arquivos com 100 MB ou mais; não exclui nada. Para a auditoria completa do projeto, use também <code>npm run audit:maintenance</code>.</p></div>
    </CardContent>
  </Card>;
}
