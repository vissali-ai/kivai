"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
const MAINTENANCE_GUIDES = [
  {
    id: "start-local",
    title: "1. Abrir o Kivai na porta 3000",
    risk: "Desenvolvimento local",
    tone: "safe",
    command: "npm run dev -- -p 3000",
    description: "Inicia o Kivai no computador em http://localhost:3000, com atualização automática ao editar o código. Mantenha este terminal aberto enquanto usa o site local; pressione Ctrl+C para encerrar. É nesse modo local que a auditoria consegue medir os arquivos do seu computador.",
  },
  {
    id: "audit",
    title: "2. Fazer o diagnóstico completo",
    risk: "Somente leitura",
    tone: "safe",
    command: "npm run audit:maintenance",
    description: "Mede as pastas monitoradas, lista arquivos grandes e verifica resíduos versionados. Não apaga nem altera arquivos.",
  },
  {
    id: "large-files",
    title: "3. Localizar arquivos acima de 100 MB",
    risk: "Somente leitura",
    tone: "safe",
    command: LARGE_FILES_COMMAND,
    description: "Percorre o projeto e ordena os arquivos grandes pelo tamanho. Use o resultado para decidir; tamanho alto, sozinho, não significa lixo.",
  },
  {
    id: "next-cache",
    title: "4. Limpeza leve do cache do Next.js",
    risk: "Pode limpar",
    tone: "safe",
    command: "Remove-Item -LiteralPath \".next/cache\" -Recurse -Force",
    description: "Remove apenas o cache de compilação. Encerre o npm run dev com Ctrl+C antes. O Next.js recria a pasta automaticamente.",
  },
  {
    id: "next-full",
    title: "5. Limpeza completa do Next.js",
    risk: "Pode limpar",
    tone: "safe",
    command: "Remove-Item -LiteralPath \".next\" -Recurse -Force",
    description: "Remove builds e caches locais do Next.js. Encerre o servidor antes; npm run dev ou npm run build recriará tudo. Não execute junto com a limpeza leve: escolha uma das duas.",
  },
  {
    id: "node-modules",
    title: "6. Reinstalar dependências Node",
    risk: "Use somente para reparar",
    tone: "caution",
    command: "npm ci",
    description: "Apaga e recria node_modules exatamente conforme o package-lock.json. Pode demorar e baixar cerca de 1 GB novamente; não reduz permanentemente o projeto.",
  },
  {
    id: "python-venv",
    title: "7. Reconstruir o ambiente Python",
    risk: "Recriável com cuidado",
    tone: "caution",
    command: "Remove-Item -LiteralPath \"backend/.venv\" -Recurse -Force\npy -m venv \"backend/.venv\"\n& \"backend/.venv/Scripts/python.exe\" -m pip install -r \"backend/requirements.txt\"",
    description: "Remove e recria toda a .venv usando requirements.txt. Use apenas se o ambiente estiver quebrado ou precisar ser reconstruído; não apague torch_cpu.dll isoladamente.",
  },
  {
    id: "git",
    title: "8. Verificar e otimizar o Git",
    risk: "Não apague arquivos manualmente",
    tone: "caution",
    command: "git count-objects -vH\ngit gc",
    description: "O primeiro comando mede os objetos; o segundo compacta o repositório de forma segura. Nunca remova arquivos de .git/objects ou arquivos .pack manualmente.",
  },
] as const;

function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} MB`;
  return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB`;
}

export function ProjectMaintenancePanel() {
  const [snapshot, setSnapshot] = useState<ProjectMaintenanceSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
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

  async function copyCommand(id: string, command: string) {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    window.setTimeout(() => setCopiedCommand((current) => current === id ? null : current), 1800);
  }

  return <Card>
    <CardHeader className="flex-row flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Wrench className="size-4 text-primary" />Código e arquivos do projeto</CardTitle><Button type="button" size="sm" variant="outline" onClick={refresh} disabled={busy}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Analisando..." : "Atualizar dados"}</Button></CardHeader>
    <CardContent>
      <p className="text-xs leading-5 text-muted-foreground">{snapshot ? snapshot.environment === "local" ? "Leitura atual do projeto no seu computador." : "Leitura do pacote disponível na implantação Vercel. Caches de desenvolvimento e arquivos do seu computador não ficam acessíveis na produção." : "Última medição local conhecida. Clique em Atualizar dados para medir o ambiente em que este painel está aberto."}</p>
      {snapshot?.deployment ? <div className="mt-3 grid gap-2 border border-white/10 p-3 text-xs sm:grid-cols-2"><p><span className="text-muted-foreground">Vercel:</span> {snapshot.deployment.environment}</p><p><span className="text-muted-foreground">Região:</span> {snapshot.deployment.region}</p><p className="truncate sm:col-span-2"><span className="text-muted-foreground">Commit:</span> {snapshot.deployment.commitSha.slice(0, 12)}</p></div> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{folders.map((folder) => <div key={folder.path} className="border border-white/10 bg-black/10 p-3"><p className="font-mono text-xs text-primary">{folder.path}</p><p className="mt-1 text-lg font-semibold">{folder.available ? formatSize(folder.sizeBytes) : "Não existe aqui"}</p><p className="text-[11px] text-muted-foreground">{folder.available ? `${folder.fileCount.toLocaleString("pt-BR")} arquivo(s)` : "Ausente neste ambiente"}</p></div>)}</div>
      {snapshot ? <div className="mt-4 border border-white/10 p-3 text-sm"><p><strong>Total encontrado:</strong> {formatSize(snapshot.totalSizeBytes)} em {snapshot.totalFileCount.toLocaleString("pt-BR")} arquivos.</p>{snapshot.truncated ? <p className="mt-1 text-xs text-amber-300">A leitura atingiu o limite de segurança; execute o comando local abaixo para uma varredura completa.</p> : null}{snapshot.largestFiles.length ? <div className="mt-3"><p className="text-xs font-medium">Arquivos acima de 100 MB</p>{snapshot.largestFiles.map((file) => <p key={file.path} className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{file.path} — {formatSize(file.sizeBytes)}</p>)}</div> : <p className="mt-1 text-xs text-emerald-300">Nenhum arquivo individual acima de 100 MB neste ambiente.</p>}</div> : null}
      {error ? <p className="mt-3 text-xs text-red-300" role="alert">{error}</p> : null}
      <div className="mt-5 border-t border-white/10 pt-5"><h3 className="text-base font-semibold">Comandos para o PowerShell do VS Code</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Abra o projeto no VS Code, acesse Terminal → Novo Terminal e confirme que o terminal está na pasta raiz do Kivai. Os comandos nunca são executados pelo painel.</p><div className="mt-4 space-y-3">{MAINTENANCE_GUIDES.map((guide) => <section key={guide.id} className="border border-white/10 bg-black/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-medium">{guide.title}</h4><Badge variant="outline" className={guide.tone === "safe" ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}>{guide.risk}</Badge></div><p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">{guide.description}</p></div><Button type="button" size="sm" variant="ghost" onClick={() => copyCommand(guide.id, guide.command)}>{copiedCommand === guide.id ? <Check /> : <Copy />}{copiedCommand === guide.id ? "Copiado" : "Copiar código"}</Button></div><code className="mt-3 block overflow-x-auto whitespace-pre-wrap break-all border border-white/10 bg-black/20 p-3 text-[11px] leading-5 text-primary">{guide.command}</code></section>)}</div><div className="mt-4 border border-red-500/25 bg-red-500/5 p-3 text-xs leading-5 text-red-200"><strong>Não apague arquivos isolados de node_modules, backend/.venv ou .git.</strong> Dependências grandes podem ser necessárias, e o histórico do Git pode ser danificado. Quando tiver dúvida, rode somente o diagnóstico e peça uma revisão do resultado antes de limpar.</div></div>
    </CardContent>
  </Card>;
}
